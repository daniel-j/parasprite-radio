

# TuneIn Broadcaster API by djazz
def tunein.nowplaying(~partner_id="",~partner_key="",~station_id="",m)
	server = "http://air.radiotime.com/Playing.ashx"
	if partner_id != "" and partner_key != "" and station_id != "" then
		title = m["title"]
		artist = m["artist"]
		album = m["album"]

		if title != "" and artist != "" then
			url = "#{server}?partnerId="^url.encode(partner_id)^"&partnerKey="^url.encode(partner_key)^"&id="^url.encode(station_id)^"&title="^url.encode(title)^"&artist="^url.encode(artist)^"&album="^url.encode(album)
			ignore(http.get(url))
		end
	end
end

