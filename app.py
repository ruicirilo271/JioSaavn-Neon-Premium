# -*- coding: utf-8 -*-
from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

API = "https://saavn.sumit.co/api"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/search/albums")
def search_albums():
    q = request.args.get("query", "")
    return jsonify(
        requests.get(f"{API}/search/albums?query={q}&page=0&limit=20").json()
    )


@app.route("/search/playlists")
def search_playlists():
    q = request.args.get("query", "")
    return jsonify(
        requests.get(f"{API}/search/playlists?query={q}&page=0&limit=20").json()
    )


@app.route("/album/<album_id>")
def album_page(album_id):
    return render_template("album.html", album_id=album_id)


@app.route("/api/album/<album_id>")
def api_album(album_id):
    return jsonify(
        requests.get(f"{API}/albums?id={album_id}").json()
    )


@app.route("/playlist/<playlist_id>")
def playlist_page(playlist_id):
    return render_template("playlist.html", playlist_id=playlist_id)


@app.route("/api/playlist/<playlist_id>")
def api_playlist(playlist_id):
    return jsonify(
        requests.get(f"{API}/playlists?id={playlist_id}").json()
    )


if __name__ == "__main__":
    app.run(debug=True)


