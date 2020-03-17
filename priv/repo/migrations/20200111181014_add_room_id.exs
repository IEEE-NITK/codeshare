defmodule Codeshare.Repo.Migrations.AddRoomId do
  use Ecto.Migration

  def change do
    alter table(:editor_state) do
      add :room_id, :string
      timestamps()
    end
  end
end
