// =======================
// VARIABLES
// =======================
let carrito = [];
let ordenActual = null;

// =======================
// INICIO
// =======================
window.onload = () => {
    cargarCategorias();
};

// =======================
// CATEGORÍAS
// =======================
async function cargarCategorias() {
    const { data } = await client.from("categorias").select("*");

    const div = document.getElementById("categorias");
    div.innerHTML = "";

    data.forEach((cat, index) => {
        const btn = document.createElement("button");
        btn.className = "categoria-btn";
        btn.innerText = cat.nombre;

        btn.onclick = () => cargarProductos(cat.id);

        div.appendChild(btn);

        if (index === 0) cargarProductos(cat.id);
    });
}

// =======================
// PRODUCTOS
// =======================
async function cargarProductos(id) {
    const { data } = await client
        .from("productos")
        .select("*")
        .eq("categoria_id", id);

    const cont = document.getElementById("productos");
    cont.innerHTML = "";

    data.forEach(p => {
        const div = document.createElement("div");
        div.className = "producto-card";

        div.innerHTML = `
            <div class="producto-img"></div>
            <h6>${p.nombre}</h6>
            <p>${p.precio} Bs</p>
        `;

        div.onclick = () => agregarProducto(p);
        cont.appendChild(div);
    });
}

// =======================
// CREAR PEDIDO
// =======================
async function crearPedido() {
    const { data, error } = await client
        .from("pedidos")
        .insert([{
            usuario_id: localStorage.getItem("usuario_id"),
            estado: "en_curso",
            total: 0,
            tipo: "local"
        }])
        .select()
        .single();

    if (error) {
        console.error(error);
        return null;
    }

    return data;
}

async function agregarProducto(p) {

    if (!ordenActual) {
        ordenActual = await crearPedido();
    }

    const item = carrito.find(i => i.id === p.id);

    if (item) {
        await sumarProducto(p.id);
        return;
    }

    await client.from("detalle_pedido").insert([{
        pedido_id: ordenActual.id,
        producto_id: p.id,
        cantidad: 1,
        precio: p.precio
    }]);

    await cargarDetallePedido();
}

async function cargarDetallePedido() {

    if (!ordenActual) return;

    const { data, error } = await client
        .from("detalle_pedido")
        .select("*, productos(nombre)")
        .eq("pedido_id", ordenActual.id)
        .order("producto_id", { ascending: true })

    if (error) {
        console.error("ERROR DETALLE:", error);
        return;
    }

    if (!data) {
        carrito = [];
        renderCarrito();
        return;
    }

    carrito = data.map(d => ({
        id: d.producto_id,
        nombre: d.productos?.nombre || "Sin nombre",
        precio: d.precio,
        cantidad: d.cantidad
    }));

    renderCarrito();
}

// =======================
// SUMAR
// =======================
async function sumarProducto(id) {

    const item = carrito.find(p => p.id === id);
    if (!item) return;

    await client
        .from("detalle_pedido")
        .update({
            cantidad: item.cantidad + 1
        })
        .eq("pedido_id", ordenActual.id)
        .eq("producto_id", id);

    await cargarDetallePedido();
}

// =======================
// RESTAR
// =======================
async function restarProducto(id) {

    const item = carrito.find(p => p.id === id);
    if (!item) return;

    if (item.cantidad <= 1) {
        await eliminarProducto(id);
        return;
    }

    await client
        .from("detalle_pedido")
        .update({
            cantidad: item.cantidad - 1
        })
        .eq("pedido_id", ordenActual.id)
        .eq("producto_id", id);

    await cargarDetallePedido();
}

// =======================
// ELIMINAR
// =======================
async function eliminarProducto(id) {

    await client
        .from("detalle_pedido")
        .delete()
        .eq("pedido_id", ordenActual.id)
        .eq("producto_id", id);

    await cargarDetallePedido();
}

// =======================
// RENDER CARRITO
// =======================
function renderCarrito() {

    const div = document.getElementById("carrito");
    div.innerHTML = "";

    let total = 0;

    carrito.forEach(p => {
        total += p.precio * p.cantidad;

        const item = document.createElement("div");
        item.className = "carrito-item";

        item.innerHTML = `
            <div>${p.nombre}</div>
            <div>${p.precio} Bs</div>

            <div class="carrito-controles">
                <button class="btn-restar">-</button>
                <span>${p.cantidad}</span>
                <button class="btn-sumar">+</button>
                <span class="btn-eliminar" style="color:red;">❌</span>
            </div>
        `;

        item.querySelector(".btn-sumar").onclick = () => sumarProducto(p.id);
        item.querySelector(".btn-restar").onclick = () => restarProducto(p.id);
        item.querySelector(".btn-eliminar").onclick = () => eliminarProducto(p.id);

        div.appendChild(item);
    });

    document.getElementById("total").innerText = total + " Bs";
}

// =======================
// PINTAR ÓRDENES
// =======================
function pintarOrdenes(lista) {

    const pantalla = document.getElementById("pantallaOrdenes");

    pantalla.innerHTML = `
        <div class="ordenes-container">

            <div class="ordenes-lista">
                ${lista.map(o => `
                    <div class="orden-row" onclick="abrirOrden('${o.id}')">
                        <div>
                            <strong>#${o.id.slice(0,6)}</strong><br>
                            ${new Date(o.fecha).toLocaleTimeString()}
                        </div>

                        <div>${o.total} Bs</div>

                        <div>${o.estado}</div>
                    </div>
                `).join("")}
            </div>

            <div class="ordenes-vacio">
                Seleccione una orden
            </div>

        </div>
    `;
}

// =======================
// VER ACTIVAS
// =======================
async function verActivas() {

    document.getElementById("productos").style.display = "none";

    const { data, error } = await client
        .from("pedidos")
        .select("*")
        .eq("estado", "en_curso")
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    pintarOrdenes(data);
}

// =======================
// VER PAGADAS
// =======================
async function verPagadas() {

    document.getElementById("productos").style.display = "none";

    const { data, error } = await client
        .from("pedidos")
        .select("*")
        .eq("estado", "pagado")
        .order("fecha", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    pintarOrdenes(data);
}

// =======================
// ABRIR ORDEN
// =======================
async function abrirOrden(id) {

    ordenActual = { id };

    await cargarDetallePedido();

    volverPOS();
}

// =======================
// VOLVER POS
// =======================
function volverPOS() {

    document.getElementById("productos").style.display = "grid";
    document.getElementById("pantallaOrdenes").innerHTML = "";
}

// =======================
// UTILIDADES
// =======================
function calcularTotal() {
    return carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
}

function logout() {
    localStorage.clear();
    location.href = "index.html";
}

function mostrarToast(msg) {
    const div = document.createElement("div");

    div.innerText = msg;
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.background = "#22c55e";
    div.style.color = "white";
    div.style.padding = "12px 18px";
    div.style.borderRadius = "10px";
    div.style.zIndex = "9999";

    document.body.appendChild(div);

    setTimeout(() => div.remove(), 2500);
}