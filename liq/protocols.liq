# protocols

# uses an external script to handle anything thrown at it!
def smart_protocol(~rlog,~maxtime,arg)
	res = get_process_lines("node scripts/smart "^string.quote(arg))
	print(res)
	res
end
add_protocol("smart", smart_protocol)

# used for NFS/SMB to copy tracks to a temporary file first
def copy_protocol(~rlog,~maxtime,arg)
	print("Copying #{arg}...")
	r = get_process_lines("scripts/copy.sh "^string.quote(arg))
	print(r)
	r
end
add_protocol("copy", temporary=true, copy_protocol)
