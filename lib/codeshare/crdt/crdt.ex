defmodule Codeshare.CRDT do
  @moduledoc """
  Manages the server-side CRDT
  """
  use Agent
  alias Codeshare.{Character, Identifier}

  # [] arg required by supervisor
  def start_link(_opts) do
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
    end |> Agent.start_link()
    # TODO: Registered with module name, which doesn't allow server crdt per session
    # (It allows for only one server crdt process)
    # Need another process to map session id with corresponding server crdt pid
  end

  @doc """
  Put payload data recived from channel
  into CRDT
  """
  def put(crdt, payload) do
    character = Character.to_struct(payload["character"])
    case Map.get(payload, "type") do
      "input" -> 
        remote_insert(crdt, character)
      "delete" ->
        remote_delete(crdt, character)
      "inputnewline" ->
        remote_insert_newline(crdt, character)
      "deletenewline" ->
        remote_delete_newline(crdt, character)
    end
  end

  @doc """
  Get CRDT data
  """
  def get(crdt) do
    Agent.get(crdt, & &1)
  end

  @doc """
  Get CRDT string representation
  """
  def get_string(crdt) do
    Agent.get(crdt, & convert_to_string(&1))
  end

  # Helper functions

  defp remote_insert(crdt, character) do
    Agent.update(crdt, fn crdt -> insert_character(crdt, character) end)
  end

  defp remote_delete(crdt, character) do
    Agent.update(crdt, fn crdt -> delete_character(crdt, character) end)
  end

  defp remote_insert_newline(crdt, character) do
    Agent.update(crdt, fn crdt -> insert_newline(crdt, character) end)
  end

  defp remote_delete_newline(crdt, character) do
    Agent.update(crdt, fn crdt -> delete_newline(crdt, character) end)
  end

  defp insert_character(crdt, character) do
    
    [first_line | crdt] = crdt
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

  defp delete_character(crdt, character) do
    
    [first_line | crdt] = crdt
    last_ch = List.last(first_line) # NOTE: Takes linear time :(

    if Character.is_greater(last_ch, character) do
      [delete_character_on_line(first_line, character) | crdt]
    else
      [first_line | delete_character(crdt, character)]
    end
  end

  defp delete_character_on_line(line, character) do

    [first_ch | line] = line

    if Character.is_equal(first_ch, character) do
      line
    else
      [first_ch | delete_character_on_line(line, character)]
    end
  end

  defp insert_newline(crdt, character) do
    
    [first_line | crdt] = crdt
    last_ch = List.last(first_line) # NOTE: Takes linear time :(

    if Character.is_greater(last_ch, character) do
      insert_newline_on_line(first_line, character) ++ crdt
    else
      [first_line | insert_newline(crdt, character)]
    end
  end

  defp insert_newline_on_line(line, character) do
    
    [first_ch | line] = line

    if Character.is_greater(first_ch, character) do
      delimeter_ch = %Character{
        ch: "",
        identifiers: character.identifiers
      }
      line1 = [delimeter_ch]
      line2 = [delimeter_ch | [first_ch | line] ]
      [line1, line2]
    else
      lines = insert_newline_on_line(line, character)
      [line1 | [line2]] = lines
      line1 = [first_ch | line1]
      [line1 | [line2]]
    end
  end

  defp delete_newline(crdt, character) do
    
    [first_line | crdt] = crdt
    last_ch = List.last(first_line) # NOTE: Takes linear time :(

    if Character.is_equal(last_ch, character) do
      line1 = first_line |> Enum.reverse |> tl |> Enum.reverse
      [[_ | line2] | crdt] = crdt
      [line1++line2 | crdt]
    else
      [first_line | delete_newline(crdt, character)]
    end
  end

  defp convert_to_string(crdt) do
    if crdt == [] do
      ""
    else
      [first_line | crdt] = crdt
      "#{convert_line_to_string(first_line)}\n#{convert_to_string(crdt)}"
    end
  end

  defp convert_line_to_string(line) do
    [first_ch | line] = line
    if line == [] do
      "#{Character.to_string(first_ch)}"
    else
      "#{Character.to_string(first_ch)}, #{convert_line_to_string(line)}"
    end
  end

end