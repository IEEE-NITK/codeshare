defmodule Codeshare.Identifier do
  alias __MODULE__

  defstruct [
    position: 0,
    siteId: -1
  ]

  def to_struct(identifier_map) do
    map = identifier_map
    %Identifier{
      position: map["position"],
      siteId: map["siteId"]
    }
  end

  # TODO: Add struct validation?
end

defmodule Codeshare.Character do
  alias __MODULE__
  alias Codeshare.Identifier

  defstruct [
    ch: "",
    identifiers: [%Identifier{}]
  ]

  def to_struct(character_map) do
    map = character_map
    %Character{
      ch: map["ch"],
      identifiers: to_identifiers_struct_list(map["identifiers"])
    }
  end

  defp to_identifiers_struct_list(identifiers_map_list) do
    if identifiers_map_list == [] do
      []
    else
      [h | t] = identifiers_map_list
      [Identifier.to_struct(h) | to_identifiers_struct_list(t)]
    end
  end

  # TODO: Add struct validation?
end