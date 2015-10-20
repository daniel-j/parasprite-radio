set("log.file", false)

test = 5

test = test+1

test = if "" == "" then
	test = test+1
	test
else
	test
end

print(test)

output.dummy(blank())
