{
  description = "Minimal Torus indexer: transfers and account balances";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          formatter = pkgs.nixpkgs-fmt;

          devShells.default = pkgs.mkShell {
            name = "torus-indexer";
            packages = with pkgs; [
              cargo
              rustc
              clippy
              rustfmt
              just
              postgresql_17
              nodejs_24
              nixpkgs-fmt
            ];
            shellHook = ''
              export DATABASE_URL="''${DATABASE_URL:-postgres://postgres@127.0.0.1:55432/torus_indexer}"
              export TORUS_RPC_URL="''${TORUS_RPC_URL:-wss://archive.torus.network}"
            '';
          };

          packages.default = pkgs.rustPlatform.buildRustPackage {
            pname = "torus-indexer";
            version = "0.1.0";
            src = pkgs.lib.fileset.toSource {
              root = ./.;
              fileset = pkgs.lib.fileset.unions [
                ./Cargo.toml
                ./Cargo.lock
                ./src
                ./migrations
                ./data
              ];
            };
            cargoLock.lockFile = ./Cargo.lock;
          };
        })
    // {
      # One systemd unit + local Postgres. Attach to any torusform-style host
      # and `colmena apply`.
      nixosModules.default = { config, lib, pkgs, ... }:
        let
          cfg = config.services.torus-indexer;
        in
        {
          options.services.torus-indexer = {
            enable = lib.mkEnableOption "Torus indexer";
            package = lib.mkOption {
              type = lib.types.package;
              default = self.packages.${pkgs.system}.default;
            };
            rpcUrl = lib.mkOption {
              type = lib.types.str;
              default = "wss://archive.torus.network";
              description = "Torus archive RPC endpoint (must serve historical state).";
            };
            bind = lib.mkOption {
              type = lib.types.str;
              default = "127.0.0.1:8080";
              description = "HTTP bind address for the read API.";
            };
            createLocalDatabase = lib.mkOption {
              type = lib.types.bool;
              default = true;
              description = "Provision a local Postgres with peer auth over the unix socket.";
            };
            databaseUrl = lib.mkOption {
              type = lib.types.str;
              default = "postgres:///torus_indexer?host=/run/postgresql";
              description = "Postgres connection string.";
            };
            environmentFile = lib.mkOption {
              type = lib.types.nullOr lib.types.path;
              default = null;
              description = "Optional env file, e.g. to inject a secret DATABASE_URL.";
            };
          };

          config = lib.mkIf cfg.enable {
            services.postgresql = lib.mkIf cfg.createLocalDatabase {
              enable = true;
              ensureDatabases = [ "torus_indexer" ];
              ensureUsers = [{
                name = "torus_indexer";
                ensureDBOwnership = true;
              }];
            };

            systemd.services.torus-indexer = {
              wantedBy = [ "multi-user.target" ];
              wants = [ "network-online.target" ];
              after = [ "network-online.target" ]
                ++ lib.optional cfg.createLocalDatabase "postgresql.service";
              requires = lib.optional cfg.createLocalDatabase "postgresql.service";
              environment = {
                DATABASE_URL = cfg.databaseUrl;
                TORUS_RPC_URL = cfg.rpcUrl;
                TORUS_INDEXER_BIND = cfg.bind;
              };
              serviceConfig = {
                ExecStart = "${cfg.package}/bin/torus-indexer";
                DynamicUser = true;
                User = "torus_indexer";
                Restart = "always";
                RestartSec = 5;
                ProtectSystem = "strict";
                ProtectHome = true;
                NoNewPrivileges = true;
                PrivateTmp = true;
              } // lib.optionalAttrs (cfg.environmentFile != null) {
                EnvironmentFile = cfg.environmentFile;
              };
            };
          };
        };
    };
}
