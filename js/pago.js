let monto = "";
let metodoSeleccionado = "efectivo";

// =======================
// ABRIR MODAL
// =======================
function abrirPago() {

    const modal = document.getElementById("modalPago");

    modal.style.display = "flex";

    modal.innerHTML = `
    <div class="pago-container">

      <!-- IZQUIERDA -->
      <div class="pago-recibo">
        <h5>Detalle</h5>
        <div id="listaPago"></div>

        <div class="pago-total">
          Total: <span id="totalPago"></span>
        </div>
      </div>

      <!-- DERECHA -->
      <div class="pago-derecha">

        <!-- MÉTODOS -->
        <div class="metodos">
          <button class="metodo activo" onclick="seleccionarMetodo('efectivo', this)">Efectivo</button>
          <button class="metodo" onclick="seleccionarMetodo('qr', this)">QR</button>
        </div>

        <!-- MONTO -->
        <h1 id="montoIngresado">0</h1>

        <!-- CAMBIO -->
        <div id="cambio" style="color:green; font-weight:bold;">Cambio: 0 Bs</div>

        <!-- TECLADO -->
        <div class="teclado">
          <button onclick="tecla(1)">1</button>
          <button onclick="tecla(2)">2</button>
          <button onclick="tecla(3)">3</button>

          <button onclick="tecla(4)">4</button>
          <button onclick="tecla(5)">5</button>
          <button onclick="tecla(6)">6</button>

          <button onclick="tecla(7)">7</button>
          <button onclick="tecla(8)">8</button>
          <button onclick="tecla(9)">9</button>

          <button onclick="borrar()">⌫</button>
          <button onclick="tecla(0)">0</button>
          <button onclick="confirmarPago()">Pagar</button>
        </div>

      </div>

    </div>
  `;

    let total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
    document.getElementById("totalPago").innerText = total + " Bs";

    renderPagoLista();
}

// =======================
// LISTA
// =======================
function renderPagoLista() {
    const div = document.getElementById("listaPago");
    div.innerHTML = "";

    carrito.forEach(p => {
        div.innerHTML += `
      <div>
        ${p.nombre} x${p.cantidad}
        <span style="float:right">${p.precio * p.cantidad} Bs</span>
      </div>
    `;
    });
}

// =======================
// MÉTODO DE PAGO
// =======================
function seleccionarMetodo(tipo, btn) {
    metodoSeleccionado = tipo;

    document.querySelectorAll(".metodo").forEach(b => b.classList.remove("activo"));
    btn.classList.add("activo");

    // 👉 mostrar método en pantalla
    if (tipo === "qr") {
        document.getElementById("montoIngresado").innerText = "QR";
        document.getElementById("cambio").innerText = "";
    } else {
        document.getElementById("montoIngresado").innerText = monto || "0";
        calcularCambio();
    }
}

// =======================
// TECLADO
// =======================
function tecla(num) {
    if (metodoSeleccionado !== "efectivo") return;

    monto += num;
    document.getElementById("montoIngresado").innerText = monto;

    calcularCambio();
}

function borrar() {
    monto = monto.slice(0, -1);
    document.getElementById("montoIngresado").innerText = monto || "0";

    calcularCambio();
}

// =======================
// CAMBIO AUTOMÁTICO
// =======================
function calcularCambio() {
    let total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
    let pago = parseFloat(monto || 0);

    let cambio = pago - total;

    if (cambio < 0) {
        document.getElementById("cambio").innerText = "Falta: " + Math.abs(cambio) + " Bs";
        document.getElementById("cambio").style.color = "red";
    } else {
        document.getElementById("cambio").innerText = "Cambio: " + cambio + " Bs";
        document.getElementById("cambio").style.color = "green";
    }
}

// =======================
// CONFIRMAR
// =======================
function confirmarPago() {

    if (carrito.length === 0) return alert("No hay productos");

    if (metodoSeleccionado === "efectivo") {
        let total = carrito.reduce((s, p) => s + p.precio * p.cantidad, 0);
        let pago = parseFloat(monto || 0);

        if (pago < total) {
            return alert("Monto insuficiente");
        }
    }

    function mostrarToast(msg) {
        const div = document.createElement("div");

        div.innerText = msg;
        div.style.position = "fixed";
        div.style.bottom = "20px";
        div.style.right = "20px";
        div.style.background = "#22c55e";
        div.style.color = "white";
        div.style.padding = "15px";
        div.style.borderRadius = "10px";

        document.body.appendChild(div);

        setTimeout(() => div.remove(), 3000);
    }
    carrito = [];
    renderCarrito();

    document.getElementById("modalPago").style.display = "none";

    monto = "";
}