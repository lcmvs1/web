// Obtener usuario
const usuario = JSON.parse(localStorage.getItem("usuario"));

// 🔒 Si no hay sesión → login
if (!usuario) {
  window.location.href = "login.html";
}

// 🚫 Validar si ya tiene caja abierta
async function verificarCaja() {
  const { data, error } = await supabase
    .from("cajas")
    .select("*")
    .eq("usuario_id", usuario.id)
    .eq("estado", "abierta");

  if (data && data.length > 0) {
    localStorage.setItem("caja", JSON.stringify(data[0]));
    window.location.href = "pos.html";
  }
}

verificarCaja();

// ✅ Abrir caja
async function abrirCaja() {
  const monto = document.getElementById("montoInicial").value;

  if (!monto || monto <= 0) {
    alert("Ingrese un monto válido");
    return;
  }

  const { data, error } = await supabase
    .from("cajas")
    .insert([{
      usuario_id: usuario.id,
      monto_inicial: monto,
      estado: "abierta"
    }])
    .select();

  if (error) {
    console.error(error);
    alert("Error al abrir caja");
    return;
  }

  // Guardar caja activa
  localStorage.setItem("caja", JSON.stringify(data[0]));

  // Ir al POS
  window.location.href = "pos.html";
}