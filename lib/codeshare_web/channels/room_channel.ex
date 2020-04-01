defmodule CodeshareWeb.RoomChannel do
  use CodeshareWeb, :channel
  import Ecto.Query, only: [from: 2]
  alias CodeshareWeb.Presence
  alias Codeshare.CRDT

  def join("room:" <> room_id, payload, socket) do
    if authorized?(payload) do
      # Add CRDT process
      CRDT.Registry.create(CRDT.Registry, room_id)

      # Print active sessions
      sessions = CRDT.Registry.get_sessions(CRDT.Registry)
      IO.puts "Active sessions"
      IO.inspect sessions
      
      query = from entry in "editor_state",
            select: entry.data,
            where: entry.room_id == ^(room_id)
      ops = Codeshare.Repo.all(query)
      send(self(), :after_join)
      {:ok, %{channel: "room:#{room_id}", ops: ops, my_id: socket.assigns.user_id}, assign(socket, :room_id, room_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))
    {:ok, _} = Presence.track(socket, "user_id:#{socket.assigns.user_id}", %{user_id: socket.assigns.user_id})
    {:noreply, socket}
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("compile", payload, socket) do #TODO: handle multiple languages, handle input
    user_id_string = to_string(socket.assigns.user_id)
    System.cmd("mkdir", [user_id_string])
    {:ok, file} = File.open(user_id_string <> "/code", [:write])
    IO.binwrite(file, payload["text"])
    File.close(file)
    IO.inspect System.cmd("bash", ["run-docker.sh", user_id_string, payload["language"]]) #TODO: pass language
    IO.inspect payload
    {:ok, output} = File.read(user_id_string <> "/output") #TODO: handle :error
    System.cmd("rm", ["-rf", user_id_string])
    {:reply, {:ok, Map.put(payload, "output", "OUTPUT:\n" <> output)}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (room:lobby).
  def handle_in("shout", payload, socket) do

    # Update server-side CRDT
    CRDT.Registry.put(CRDT.Registry, socket.assigns.room_id, payload)
    # IO.inspect CRDT.get()

    editor = %Codeshare.Editor{}
    changeset = Codeshare.Editor.changeset(editor, %{data: payload, room_id: socket.assigns.room_id})
    Codeshare.Repo.insert(changeset)
    broadcast(socket, "shout", payload)
    {:noreply, socket}
  end

  def handle_in("updateCursor", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    broadcast(socket, "updateCursor", payload)
    {:noreply, socket}
  end

  def handle_in("check", payload, socket) do
    IO.puts "CRDT: #{socket.assigns.user_id}:"
    IO.puts payload["value"]
    IO.puts "CRDT: Server:"
    IO.puts CRDT.Registry.get_string(CRDT.Registry, socket.assigns.room_id)

    if payload["value"] == CRDT.Registry.get_string(CRDT.Registry, socket.assigns.room_id) do
      {:reply, {:ok, %{"flag" => true}}, socket}
    else
      {:reply, {:ok, %{"flag" => false}}, socket}
    end
  end

  def terminate(_ , socket) do
    # When last active channel is terminating, 
    # empty the database
    if map_size(Presence.list(socket)) == 1 do
      query = from editor in "editor_state",
            select: editor.data
      Codeshare.Repo.delete_all(query)

      # Stop CRDT process
      CRDT.Registry.stop(CRDT.Registry, socket.assigns.room_id)
      IO.puts "Session #{String.slice(socket.assigns.room_id, 0..6)} terminated"
    end
    :ok
  end

  defp authorized?(_payload) do
    true
  end
end
