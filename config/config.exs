# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :codeshare, Codeshare.Repo,
  database: "codeshare_repo",
  username: "postgres",
  password: "postgres",
  hostname: "localhost"

config :codeshare,
  ecto_repos: [Codeshare.Repo]

# Configures the endpoint
config :codeshare, CodeshareWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "vBvCi/s5EU69ysakAGIc2LkTGzgpKW51zdhsG8hmjFq5ubX+YAL/y1c9NdgkMOdW",
  render_errors: [view: CodeshareWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Codeshare.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
