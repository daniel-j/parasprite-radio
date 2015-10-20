
# since liquidsoap doesn't have list[key] = value
# this keeps the assoc list clean of duplicate keys
# usage: list.set_pair((key, value), list)
def list.set_pair(p, l)
	l = list.remove_assoc(fst(p), l)
	list.add(p, l)
end

# same as above but takes a list of pairs instead
def list.set_list(new, l)
	outl = ref l
	list.iter(fun(p) -> begin
		outl := list.remove_assoc(fst(p), !outl)
	end, new)
	list.append(new, !outl)
end

# Add a skip function to a source
# when it does not have one
# by default
def add_skip_command(~command,s)
	# Register the command:
	server.register(
		usage="skip",
		description="Skip the current song in source.",
		command,
		fun(_) -> begin
			print("Skipping...")
			source.skip(s)
			"OK!"
		end
	)
end