import supabase from "./supabase.js";

export async function getPeople() {
  const { data: peoples, error } = await supabase.from("peoples").select("*");

  if (error) {
    console.log(error);
    throw new Error("Peoples could not be loaded");
  }

  return peoples;
}
