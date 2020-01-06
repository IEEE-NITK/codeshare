defmodule CodeshareWeb.RoomChannel do
  use CodeshareWeb, :channel
  import Ecto.Query, only: [from: 2]
  alias CodeshareWeb.Presence

  def join("room:" <> room_id, payload, socket) do
    if authorized?(payload) do
      send(self(), :after_join)
      {:ok, %{channel: "room:#{room_id}"}, assign(socket, :room_id, room_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_info(:after_join, socket) do
    push(socket, "presence_state", Presence.list(socket))
    {:ok, _} = Presence.track(socket, "user_id:#{socket.assigns.user_id}", %{user_id: socket.assigns.user_id})
    {:noreply, socket}
  end

  def handle_in("get_my_id", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    {:reply, {:ok, payload}, socket}
  end

  def handle_in("get_old_operations", payload, socket) do
    query = from editor in "editor_state",
            select: editor.data
    ops = Codeshare.Repo.all(query)
    snd_payload = %{ops: ops}
    {:reply, {:ok, snd_payload}, socket}
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (room:lobby).
  def handle_in("shout", payload, socket) do
    editor = %Codeshare.Editor{}
    changeset = Codeshare.Editor.changeset(editor, %{data: payload})
    Codeshare.Repo.insert(changeset)
    broadcast(socket, "shout", payload)
    {:noreply, socket}
  end

  def handle_in("updateCursor", payload, socket) do
    payload = Map.put(payload, "user_id", socket.assigns.user_id)
    broadcast(socket, "updateCursor", payload)
    {:noreply, socket}
  end

  defp authorized?(_payload) do
    true
  end
end
