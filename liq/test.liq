set("log.file", false)

#file = "{\"a\" : 4, \"b\" : 5}"

#file = get_process_output("cat ../config.json")

file = "{\"port\" : 8000, \"media_dir\" : 123}"

print(file)

config=of_json(default=[("x",0)],file)


print(config)
