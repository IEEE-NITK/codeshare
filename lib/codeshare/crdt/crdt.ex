defmodule Codeshare.CRDT do
  alias __MODULE__
  use Agent
  alias Codeshare.{Character, Identifier}

  # [] arg required by supervisor
  def start_link([]) do
    fn -> [[
      %Character{
        ch: "",
        identifiers: [%Identifier{
          position: 0,
          siteID: -1
        }]
      },
      %Character{
        ch: "",
        identifiers: [%Identifier{
            position: 1,
            siteID: 16777216 #TODO: Infinity for now; think of something
          }]
      }
    ]]
    end |> Agent.start_link(name: __MODULE__)
    # TODO: Registered with module name, which doesn't allow server crdt per session
    # (It allows for only one server crdt process)
    # Need another process to map session id with corresponding server crdt pid
  end

  def put(payload) do
    character = Character.to_struct(payload["character"])
    case Map.get(payload, "type") do
      "input" -> 
        remote_insert(character)
      "delete" ->
        remote_delete(character)
      "inputnewline" ->
        remote_insert_newline(character)
      "deletenewline" ->
        remote_delete_newline(character)
    end
    # Agent.update(__MODULE__, fn list -> [payload | list] end)
  end

  def get() do
    Agent.get(__MODULE__, & &1)
  end

  defp remote_insert(character) do
    Agent.update(__MODULE__, fn crdt -> insert_character(crdt, character) end)
  end

  defp remote_delete(character) do
    "delete"
  end

  defp remote_insert_newline(character) do
    "inputnewline"
  end

  defp remote_delete_newline(character) do
    "deletenewline"
  end

  defp insert_character(crdt, character) do
    
    [ first_line | crdt] = crdt
    last_ch = List.last(first_line) # NOTE: Takes linear time :(

    if Character.is_greater(last_ch, character) do
      [insert_character_on_line(first_line, character) | crdt]
    else
      [first_line | insert_character(crdt, character)]
    end
  end

  defp insert_character_on_line(line, character) do

    [first_ch | line] = line

    if Character.is_greater(first_ch, character) do
      [character | [ first_ch | line] ]
    else
      [first_ch | insert_character_on_line(line, character)]
    end
  end

end