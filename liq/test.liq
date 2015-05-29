set("log.file", false)

l = []

l = list.append([("abc", 123)], l)
l = list.append([("dfg", 456)], l)
l = list.append([("abc", 999)], l)

#l = list.remove(("abc", l["abc"]), l)
ignore(l)
#print(l)



#file = "{\"a\" : 4, \"b\" : 5}"

file = get_process_output("node scripts/get-config")

#file = "{\"port\" : \"abc\", \"media_dir\" : \"lol\"}"

#print(file)

config=of_json(default=[("error", "json")],file)


print(config)
