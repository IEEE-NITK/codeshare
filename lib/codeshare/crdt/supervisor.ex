defmodule Codeshare.CRDT.Supervisor do
  @moduledoc """
  Supervise CRDT Registry
  and CRDT processes
  """
  use Supervisor
  alias Codeshare.CRDT

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  @impl true
  def init(:ok) do
    children = [
      {CRDT.Registry, name: CRDT.Registry}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

end