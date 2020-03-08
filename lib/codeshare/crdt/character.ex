defmodule Codeshare.Identifier do
  alias __MODULE__

  defstruct [
    position: 0,
    siteID: -1
  ]

  def to_struct(identifier_map) do
    map = identifier_map
    %Identifier{
      position: map["position"],
      siteID: map["siteID"]
    }
  end

  def is_equal(id1, id2) do
    id1.position == id2.position && id1.siteID == id2.siteID
  end

  def is_greater(id1, id2) do
    if id1.position == id2.position do
      id1.siteID > id2.siteID
    else
      id1.position > id2.position
    end
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

  def is_equal(character1, character2) do
    if character1.ch != character2.ch || 
        length(character1.identifiers) != length(character2.identifiers) do
      false      
    else
      is_identifier_list_equal(character1.identifiers, 
        character2.identifiers)
    end
  end

  defp is_identifier_list_equal(id_list1, id_list2) do
    if id_list1 == [] && id_list2 == [] do
      true
    else
      [id1 | id_list1] = id_list1
      [id2 | id_list2] = id_list2

      if Identifier.is_equal(id1, id2) do
        is_identifier_list_equal(id_list1, id_list2)
      else
        false
      end
    end
  end

  def is_greater(character1, character2) do
    is_identifier_list_greater(character1.identifiers, 
                                character2.identifiers)
  end

  defp is_identifier_list_greater(id_list1, id_list2) do

    cond do
      id_list1 == [] ->
        false
      id_list2 == [] ->
        true
      true ->
        [id1 | id_list1] = id_list1
        [id2 | id_list2] = id_list2

        cond do
          Identifier.is_greater(id1, id2) ->
            true
          Identifier.is_greater(id2, id1) ->
            false
          Identifier.is_equal(id1, id2) ->
            is_identifier_list_greater(id_list1, id_list2)
        end
    end

  end

  # TODO: Add struct validation?
end