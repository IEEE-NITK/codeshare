
defmodule CodeshareWeb.RoomChannel do
  use CodeshareWeb, :channel
  alias CodeshareWeb.Presence
  def join("room:lobby", payload, socket) do
    if authorized?(payload) do
      send(self(), :after_join)
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end
  def handle_info(:after_join, socket) do
    userColor= socket.assigns.user_color
    Presence.track(socket, socket.assigns.user_name, %{cursor_color: userColor, has_cursor: false})
    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end
    
  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (room:lobby).
  def handle_in("shout", payload, socket) do
    broadcast socket, "shout", payload
    {:noreply, socket}
  end

  def handle_in("updateCursor", payload, socket) do
    payload = Map.put(payload, "user_name", socket.assigns.user_name)
    broadcast socket, "updateCursor", payload
    {:noreply, socket}
  end

  defp authorized?(_payload) do
    true
  end
end
 
