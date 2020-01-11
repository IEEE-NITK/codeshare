defmodule Codeshare.Editor do
  use Ecto.Schema
  import Ecto.Changeset

  schema "editor_state" do
    field :data, :map
    field :room_id, :string

    timestamps()
  end

  @doc false
  def changeset(editor, attrs) do
    editor
    |> cast(attrs, [:data, :room_id])
    |> validate_required([:data, :room_id])
  end
end
