defmodule Codeshare.Editor do
    use Ecto.Schema
    schema "editor_state" do
        field :data, :map
    end
    def changeset(editor, params \\%{}) do
        editor
        |>Ecto.Changeset.cast(params,[:data])
        |>Ecto.Changeset.validate_required([:data])           
    end
end