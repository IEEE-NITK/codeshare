defmodule Codeshare.Repo do
  use Ecto.Repo,
    otp_app: :codeshare,
    adapter: Ecto.Adapters.Postgres
end
