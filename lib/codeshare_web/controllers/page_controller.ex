defmodule CodeshareWeb.PageController do
  use CodeshareWeb, :controller

 
  def index(conn, _params) do
    render(conn, "index.html")
  end
  """
  def index(conn,%{"user_name" => user_name}) do
    render(conn,"index.html",user_name: user_name)
  end
  """
end
