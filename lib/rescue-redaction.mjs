export function redact(value){
  if(Array.isArray(value))return value.map(redact);
  if(!value||typeof value!=="object")return value;
  return Object.fromEntries(Object.entries(value).map(([key,item])=>
    /secret|token|authorization|cookie/i.test(key)?[key,"[REDACTED]"]:[key,redact(item)]
  ));
}
