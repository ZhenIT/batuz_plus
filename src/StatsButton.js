function buildCustomerGraph(data) {
    const customerTotals = {};

    data.facturas.forEach(factura => {
        const customer = factura.razonSocial ? factura.razonSocial : factura.nombre + ' ' + factura.primerApellido + ' ' + factura.segundoApellido;
        customerTotals[customer] = (customerTotals[customer] || 0) + factura.importeTotalFactura;
    });

    const sortedCustomers = Object.entries(customerTotals)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedCustomers.map(entry => entry[0]);
    const values = sortedCustomers.map(entry => entry[1]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Guztira bezeroko',
                data: values,
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    display: false
                }
            }
        }
    });

    return canvas;
}

function buildMonthlyGraph(data) {
    const monthlyTotals = {};

    data.facturas.forEach(factura => {
        const month = factura.fechaExpedicionFactura.substring(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + factura.importeTotalFactura;
    });

    const labels = Object.keys(monthlyTotals).sort();
    const values = labels.map(month => monthlyTotals[month]);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Guztira hileko',
                data: values,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    return canvas;
}

function showStats(data) {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    modal.style.minWidth = '1000px';
    modal.style.minHeight = '900px';
    modal.style.zIndex = '1000';

    modal.appendChild(
        buildCustomerGraph(data)
    );
    modal.appendChild(
        buildMonthlyGraph(data)
    );

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Itxi';
    closeButton.style.marginTop = '10px';
    closeButton.onclick = () => document.body.removeChild(modal);
    modal.appendChild(closeButton);

    document.body.appendChild(modal);
}

function addStatsButton() {
    waitForElement(".p-datatable-scrollable-header-box", (container) => {
        const button = document.createElement("button");
        button.className = "p-button p-component p-button-info p-button-text-icon-left";
        button.innerHTML = `<span class="pi pi-chart-bar p-c p-button-icon-left"></span><span class="p-button-text p-c">Estatistikak</span>`;
        button.onclick = async () => {
            let sessionData;
            try {
                sessionData = JSON.parse(sessionStorage.getItem("bide-seguridad:sessionData")) || {};
            } catch (e) {
                console.error("Failed to parse session data:", e);
                sessionData = {};
            }
            const idPersona = sessionData?.session?.userSession?.idPersona;
            const accessToken = sessionData?.accessToken;
            if (idPersona && accessToken) {
                const filtro = buildFiltro(idPersona);
                let data;
                try {
                    const response = await fetch(`https://batuz.eus/B4TBFA0M/rest/v1/factura/obtenerListadoFacturasFiltro?filtro=${filtro}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    data = await response.json();
                } catch (error) {
                    console.error('Fetch error:', error);
                    alert('Failed to fetch invoices. Please try again later.');
                    return;
                }
                showStats(data);
            } else {
                alert("Failed to retrieve session data or access token.");
            }
        };
        container.appendChild(button);
    });
}
