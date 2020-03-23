defmodule Codeshare.CRDT.Registry do
  @moduledoc """
  Registry mapping session id -> crdt process
  """
  alias __MODULE__
  use GenServer
  alias Codeshare.CRDT

  ## API to accessing CRDT

  @doc """
  Start the registry
  """
  def start_link(opts) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  def create(server, session_id) do
    GenServer.cast(server, {:create, session_id})
  end

  def put(server, session_id, payload) do
    GenServer.cast(server, {:put, session_id, payload})
  end

  def get_string(server, session_id) do
    GenServer.call(server, {:get_string, session_id})
  end

  ## Defining GenSever Callback

  @impl true
  def init(:ok) do
    {:ok, %{}}
  end

  @impl true
  def handle_cast({:create, session_id}, sessions) do
    if Map.has_key?(sessions, session_id) do
      {:noreply, sessions}
    else
      {:ok, crdt} = CRDT.start_link([])
      {:noreply, Map.put(sessions, session_id, crdt)}
    end
  end

  @impl true
  def handle_cast({:put, session_id, payload}, sessions) do
    {:ok, crdt} = Map.fetch(sessions, session_id)
    CRDT.put(crdt, payload)
    {:noreply, sessions}
  end

  @impl true
  def handle_call({:get_string, session_id}, _from, sessions) do
    {:ok, crdt} = Map.fetch(sessions, session_id)
    {:reply, CRDT.get_string(crdt), sessions}
  end

end