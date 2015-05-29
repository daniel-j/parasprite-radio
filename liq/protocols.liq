# protocols

# uses an external script to handle anything thrown at it!
def smart_protocol(arg,delay)
	res = get_process_lines("node scripts/smart "^quote(arg))
	print(res)
	res
end
add_protocol("smart", smart_protocol)

# used for NFS/SMB to copy tracks to a temporary file first
def copy_protocol(arg,delay)
	print("Copying #{arg}...")
	r = get_process_lines("scripts/copy.sh "^quote(arg))
	print(r)
	r
end
add_protocol("copy", temporary=true, copy_protocol)
