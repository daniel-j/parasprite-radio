
confsrc = get_process_output("node scripts/get-config")
config = of_json(default=[("error", "json")], confsrc)

if config["error"] == "json" then
	print("Failed to parse config JSON:")
	print(confsrc)
	shutdown()
end

def confstr(key,default="") =
	c = config[key]
	if c == "" then
		default
	else
		c
	end
end
def confint(key,default=0) = int_of_string(config[key], default=default) end
def conffloat(key,default=0.0) = float_of_string(config[key], default=default) end
def confbool(key,default=false) = bool_of_string(config[key], default=default) end
