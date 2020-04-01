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

  def stop(server, session_id) do
    GenServer.cast(server, {:stop, session_id})
  end

  def get_string(server, session_id) do
    GenServer.call(server, {:get_string, session_id})
  end

  # Debugging function
  def get_sessions(server) do
    GenServer.call(server, {:get_sessions})
  end

  ## Defining GenSever Callback

  @impl true
  def init(:ok) do
    sessions = %{}
    refs = %{}
    {:ok, {sessions, refs}}
  end

  @impl true
  def handle_cast({:create, session_id}, {sessions, refs}) do
    if Map.has_key?(sessions, session_id) do
      {:noreply, {sessions, refs}}
    else
      {:ok, crdt} = CRDT.start_link([])
      ref = Process.monitor(crdt)
      refs = Map.put(refs, ref, session_id)
      sessions = Map.put(sessions, session_id, crdt)
      {:noreply, {sessions, refs}}
    end
  end

  @impl true
  def handle_cast({:put, session_id, payload}, {sessions, refs}) do
    {:ok, crdt} = Map.fetch(sessions, session_id)
    CRDT.put(crdt, payload)
    {:noreply, {sessions, refs}}
  end

  @impl true
  def handle_cast({:stop, session_id}, {sessions, refs}) do
    {:ok, crdt} = Map.fetch(sessions, session_id)
    CRDT.stop(crdt)
    {:noreply, {sessions, refs}}
  end

  @impl true
  def handle_call({:get_string, session_id}, _from, {sessions, refs}) do
    {:ok, crdt} = Map.fetch(sessions, session_id)
    {:reply, CRDT.get_string(crdt), {sessions, refs}}
  end

  @impl true
  def handle_call({:get_sessions}, _from, {sessions, refs}) do
    {:reply, sessions, {sessions, refs}}
  end

  @impl true
  def handle_info({:DOWN, ref, :process, _pid, _reason}, {sessions, refs}) do
    {session_id, refs} = Map.pop(refs, ref)
    sessions = Map.delete(sessions, session_id)
    {:noreply, {sessions, refs}}
  end

  @impl true
  def handle_info(_msg, state) do
    {:noreply, state}
  end
end