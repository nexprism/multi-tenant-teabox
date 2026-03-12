export function buildNextelArgs(template, vars) {
  return template.match(/\{\{(.*?)\}\}/g)?.map((match) => {
    const key = match.replace("{{", "").replace("}}", "").trim();
    return vars[key] || "";
  }) || [];
}
