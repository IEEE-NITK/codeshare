defmodule Codeshare.Repo.Migrations.CreateEditorTable do
  use Ecto.Migration

  def change do
    create table(:editor_state) do
      add :data, :jsonb
    end

  end
end
