// Base de datos local en memoria (LocalStorage)
let gastos = JSON.parse(localStorage.getItem('gastos_control')) || [
    { id: '1', descripcion: 'Pago de Internet Oficina', proveedor: 'Compañía Telco', categoria: 'Servicios', monto: 120.00, vencimiento: '2026-10-20', pagado: false, fechaPago: null },
    { id: '2', descripcion: 'Alquiler de local comercial', proveedor: 'Inmobiliaria Central', categoria: 'Proveedores', monto: 850.00, vencimiento: '2026-10-10', pagado: false, fechaPago: null },
    { id: '3', descripcion: 'Compra de suministros de limpieza', proveedor: 'Global Clean', categoria: 'Otros', monto: 45.50, vencimiento: '2026-10-05', pagado: true, fechaPago: '2026-10-04' }
];

// Inicialización al cargar la ventana
window.onload = function() {
    // Establecer fecha por defecto en los inputs de fecha (hoy)
    const hoyStr = new Date().toISOString().split('T')[0];
    document.getElementById('vencimiento').value = hoyStr;
    document.getElementById('fecha-pago-input').value = hoyStr;

    // Establecer mes actual en el selector del gerente
    const anioMesActual = hoyStr.substring(0, 7);
    document.getElementById('selector-mes').value = anioMesActual;

    renderizarTodo();
};

// Guardar en LocalStorage
function guardarEnStorage() {
    localStorage.setItem('gastos_control', JSON.stringify(gastos));
}

// Cambiar vistas entre Asistente y Gerente
function cambiarVista(vista) {
    const btnAsistente = document.getElementById('btn-asistente');
    const btnGerente = document.getElementById('btn-gerente');
    const vistaAsistente = document.getElementById('vista-asistente');
    const vistaGerente = document.getElementById('vista-gerente');

    if (vista === 'asistente') {
        vistaAsistente.classList.remove('hidden');
        vistaGerente.classList.add('hidden');
        btnAsistente.className = "px-4 py-2 rounded-md font-medium text-sm transition bg-white text-indigo-700 shadow";
        btnGerente.className = "px-4 py-2 rounded-md font-medium text-sm transition text-indigo-200 hover:text-white";
    } else {
        vistaAsistente.classList.add('hidden');
        vistaGerente.classList.remove('hidden');
        btnGerente.className = "px-4 py-2 rounded-md font-medium text-sm transition bg-white text-indigo-700 shadow";
        btnAsistente.className = "px-4 py-2 rounded-md font-medium text-sm transition text-indigo-200 hover:text-white";
        actualizarResumenGerente();
    }
}

// Obtener el estado real de un gasto basado en fecha actual
function obtenerEstadoGasto(gasto) {
    if (gasto.pagado) return 'Pagado';
    
    const hoy = new Date().toISOString().split('T')[0];
    if (gasto.vencimiento < hoy) {
        return 'Vencido';
    }
    return 'Pendiente';
}

// Renderizar listados y filtros
function renderizarTodo() {
    filtrarGastos();
    actualizarResumenGerente();
}

// Filtrar y ordenar gastos para la Asistente (HU-03: Próximos a vencer primero)
function filtrarGastos() {
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase();
    const filtroEstado = document.getElementById('filtro-estado').value;
    const tbody = document.getElementById('tabla-gastos-body');

    let listaFiltrada = gastos.map(g => ({ ...g, estadoActual: obtenerEstadoGasto(g) }));

    // Filtrar por texto
    if (textoBusqueda) {
        listaFiltrada = listaFiltrada.filter(g => 
            g.descripcion.toLowerCase().includes(textoBusqueda) || 
            (g.proveedor && g.proveedor.toLowerCase().includes(textoBusqueda))
        );
    }

    // Filtrar por estado
    if (filtroEstado !== 'TODOS') {
        listaFiltrada = listaFiltrada.filter(g => g.estadoActual === filtroEstado);
    }

    // Ordenamiento requerido por HU-03: Pendientes más próximos a vencer primero
    listaFiltrada.sort((a, b) => {
        if (a.pagado !== b.pagado) return a.pagado ? 1 : -1; // Los pagados al final
        return new Date(a.vencimiento) - new Date(b.vencimiento);
    });

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No se encontraron gastos registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaFiltrada.map(g => {
        let badgeColor = '';
        if (g.estadoActual === 'Pendiente') badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
        else if (g.estadoActual === 'Vencido') badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200 font-bold animate-pulse';
        else badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';

        return `
            <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
                <td class="p-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}">${g.estadoActual}</span></td>
                <td class="p-3 font-medium text-slate-800">${g.descripcion}</td>
                <td class="p-3 text-slate-600">${g.proveedor || '—'}</td>
                <td class="p-3"><span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">${g.categoria}</span></td>
                <td class="p-3 text-slate-600">${g.vencimiento}</td>
                <td class="p-3 font-semibold text-slate-800">$${Number(g.monto).toFixed(2)}</td>
                <td class="p-3 text-center space-x-2">
                    ${!g.pagado ? `<button onclick="abrirModalPago('${g.id}')" class="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition" title="Marcar como pagado">Pagar</button>` : `<span class="text-xs text-emerald-600 font-medium">Pago: ${g.fechaPago}</span>`}
                    <button onclick="cargarEdicion('${g.id}')" class="px-2.5 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 transition" title="Editar gasto">Editar</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Guardar o Actualizar Gasto (HU-01 y HU-05)
function guardarGasto(event) {
    event.preventDefault();
    const id = document.getElementById('gasto-id').value;
    const descripcion = document.getElementById('descripcion').value;
    const proveedor = document.getElementById('proveedor').value;
    const categoria = document.getElementById('categoria').value;
    const monto = parseFloat(document.getElementById('monto').value);
    const vencimiento = document.getElementById('vencimiento').value;

    if (monto <= 0) {
        alert('El monto debe ser mayor que cero.');
        return;
    }

    if (id) {
        // Editar existente (HU-05)
        const gasto = gastos.find(g => g.id === id);
        if (gasto) {
            gasto.descripcion = descripcion;
            gasto.proveedor = proveedor;
            gasto.categoria = categoria;
            gasto.monto = monto;
            gasto.vencimiento = vencimiento;
        }
        cancelarEdicion();
    } else {
        // Crear nuevo (HU-01)
        const nuevoGasto = {
            id: Date.now().toString(),
            descripcion,
            proveedor,
            categoria,
            monto,
            vencimiento,
            pagado: false,
            fechaPago: null
        };
        gastos.push(nuevoGasto);
        document.getElementById('form-gasto').reset();
        const hoyStr = new Date().toISOString().split('T')[0];
        document.getElementById('vencimiento').value = hoyStr;
    }

    guardarEnStorage();
    renderizarTodo();
}

// Cargar datos en el formulario para editar (HU-05)
function cargarEdicion(id) {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;

    document.getElementById('gasto-id').value = gasto.id;
    document.getElementById('descripcion').value = gasto.descripcion;
    document.getElementById('proveedor').value = gasto.proveedor || '';
    document.getElementById('categoria').value = gasto.categoria;
    document.getElementById('monto').value = gasto.monto;
    document.getElementById('vencimiento').value = gasto.vencimiento;

    document.getElementById('form-titulo').innerText = 'Corregir / Editar Gasto';
    document.getElementById('btn-submit-gasto').innerText = 'Actualizar Gasto';
    document.getElementById('btn-cancelar-edicion').classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancelar edición
function cancelarEdicion() {
    document.getElementById('form-gasto').reset();
    document.getElementById('gasto-id').value = '';
    document.getElementById('form-titulo').innerText = 'Registrar Nuevo Gasto';
    document.getElementById('btn-submit-gasto').innerText = 'Guardar Gasto';
    document.getElementById('btn-cancelar-edicion').classList.add('hidden');
    const hoyStr = new Date().toISOString().split('T')[0];
    document.getElementById('vencimiento').value = hoyStr;
}

// Modal de Pago Manual (HU-04)
function abrirModalPago(id) {
    document.getElementById('pago-gasto-id').value = id;
    document.getElementById('modal-pago').classList.remove('hidden');
}

function cerrarModalPago() {
    document.getElementById('modal-pago').classList.add('hidden');
}

function confirmarPago() {
    const id = document.getElementById('pago-gasto-id').value;
    const fechaPago = document.getElementById('fecha-pago-input').value;

    const gasto = gastos.find(g => g.id === id);
    if (gasto) {
        gasto.pagado = true;
        gasto.fechaPago = fechaPago;
        guardarEnStorage();
        renderizarTodo();
    }
    cerrarModalPago();
}

// Resumen Gerente por Mes de Vencimiento (HU-02 y HU-07)
function actualizarResumenGerente() {
    const mesSeleccionado = document.getElementById('selector-mes').value; // Formato YYYY-MM
    const tbody = document.getElementById('tabla-gerente-body');

    // Filtrar gastos cuyo mes de vencimiento coincida con el seleccionado
    const gastosMes = gastos.filter(g => g.vencimiento.startsWith(mesSeleccionado));

    let totalMes = 0;
    let totalPendiente = 0;
    let totalVencido = 0;
    let totalPagado = 0;

    const listaDetalle = gastosMes.map(g => {
        const estado = obtenerEstadoGasto(g);
        totalMes += Number(g.monto);
        if (estado === 'Pendiente') totalPendiente += Number(g.monto);
        if (estado === 'Vencido') totalVencido += Number(g.monto);
        if (estado === 'Pagado') totalPagado += Number(g.monto);

        let badgeColor = '';
        if (estado === 'Pendiente') badgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
        else if (estado === 'Vencido') badgeColor = 'bg-rose-100 text-rose-800 border border-rose-200 font-bold';
        else badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';

        return { ...g, estadoActual: estado, badgeColor };
    });

    // Actualizar tarjetas de totales
    document.getElementById('gerente-total').innerText = `$${totalMes.toFixed(2)}`;
    document.getElementById('gerente-pendiente').innerText = `$${totalPendiente.toFixed(2)}`;
    document.getElementById('gerente-vencido').innerText = `$${totalVencido.toFixed(2)}`;
    document.getElementById('gerente-pagado').innerText = `$${totalPagado.toFixed(2)}`;

    if (listaDetalle.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">No hay gastos registrados para este mes.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaDetalle.map(g => `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100">
            <td class="p-3"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${g.badgeColor}">${g.estadoActual}</span></td>
            <td class="p-3 font-medium text-slate-800">${g.descripcion}</td>
            <td class="p-3 text-slate-600">${g.proveedor || '—'}</td>
            <td class="p-3 text-slate-600">${g.vencimiento}</td>
            <td class="p-3 font-semibold text-slate-800">$${Number(g.monto).toFixed(2)}</td>
            <td class="p-3 text-slate-500">${g.fechaPago || '—'}</td>
        </tr>
    `).join('');
}
