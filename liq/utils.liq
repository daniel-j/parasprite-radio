
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
