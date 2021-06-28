let addToCart = document.querySelectorAll('.add_to_cart');
let cartCounter = document.querySelector('#cartCounter');
const alertMsg = document.querySelector('#success-alert');

var preloader = document.getElementById('preloader');

function loadingFunc(){
    preloader.style.display = 'none';
}

function updateCart(pizza) {
	axios.post('/update-cart',pizza).then(res => {
		cartCounter.innerText = res.data.totalQty;
	})
}

addToCart.forEach((btn)=> {
	btn.addEventListener('click', (e)=> {
		
		let pizza =JSON.parse(btn.dataset.pizza);
		updateCart(pizza)		
	})
})


function noty(){
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }

      toastr["success"]("Order Status Updated.")

}

function notyadmin(){
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }

      toastr["success"]("New Order Received")

}

if(alertMsg) {
	setTimeout(()=> {
		alertMsg.remove()
	},3000)
}

//admin

function initAdmin(socket) {
    const orderTableBody = document.querySelector('#orderTableBody')
    let orders = []
    let markup

    axios.get('/adminorders', {
        headers: {
            "X-Requested-With": "XMLHttpRequest"
        }
    }).then(res => {
        orders = res.data
        markup = generateMarkup(orders)
        orderTableBody.innerHTML = markup
    }).catch(err => {
        console.log(err)
    })

    function renderItems(items) {
        let parsedItems = Object.values(items)
        return parsedItems.map((menuItem) => {
            return `
                <p>${ menuItem.item.name } - ${ menuItem.qty } pcs </p>
            `
        }).join('')
      }

    function generateMarkup(orders) {
        return orders.map(order => {
            return `
                <tr>
                <td class="border px-4 py-2 text-green-900">
                    <p class="adminid">${ order._id }</p>
                    <div class="adminitem">${ renderItems(order.items) }</div>
                </td>
                <td class="border px-4 py-2 adminid">${ order.customerId.name }</td>
				<td class="border px-4 py-2 adminid">${ order.contact }</td>
                <td class="border px-4 py-2 adminid">${ order.address }</td>
                <td class="border px-4 py-2 adminid">
                    <div class="inline-block relative w-64">
                        <form action="/adminorderstatus" method="POST">
                            <input type="hidden" name="orderId" value="${ order._id }">
                            <select name="status" onchange="this.form.submit()"
                                class="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline">
                                <option value="order_placed"
                                    ${ order.status === 'Order_Placed' ? 'selected' : '' }>
                                    Placed</option>
                                <option value="confirmed" ${ order.status === 'confirmed' ? 'selected' : '' }>
                                    Confirmed</option>
                                <option value="prepared" ${ order.status === 'prepared' ? 'selected' : '' }>
                                    Prepared</option>
                                <option value="delivered" ${ order.status === 'delivered' ? 'selected' : '' }>
                                    Delivered
                                </option>
                                <option value="completed" ${ order.status === 'completed' ? 'selected' : '' }>
                                    Completed
                                </option>
                            </select>
                        </form>
                        <div
                            class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20">
                                <path
                                    d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </td>
                <td class="border px-4 py-2 adminid">
                    ${ moment(order.createdAt).format('hh:mm A') }
                </td>
            </tr>
        `
        }).join('')
    }

    socket.on('orderPlaced',(order) => {
        orders.unshift(order)
        notyadmin()
        orderTableBody.innerHTML = ''
        orderTableBody.innerHTML = generateMarkup(orders)
    })
}


$('.add_to_cart').click(function(){
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }

      toastr["success"]("Item added Successfully")

});


// Change Order Status

let statuses= document.querySelectorAll('.status_line')
let order= document.querySelector('#hiddeninput') ? document.querySelector('#hiddeninput').value : null
order=JSON.parse(order)

let time = document.createElement('small')

function updateStatus(order) {
    
    statuses.forEach((status)=> {

        status.classList.remove('step-completed')
        status.classList.remove('current-status')
    })

    let stepCompleted = true;
    statuses.forEach((status)=> {
        let dataProp = status.dataset.status
        if(stepCompleted) {
            status.classList.add('step-completed')
        }
        if(dataProp === order.status) {
            stepCompleted = false
            time.innerText = moment(order.updatedAt).format('hh:mm A')
            status.appendChild(time)
            if(status.nextElementSibling) {
                status.nextElementSibling.classList.add('current-status')
            }
        }
    })

}

updateStatus(order)

let socket = io()

//Socket

if(order) {
    socket.emit('join', `order_${order._id}`)
}

let adminAreaPath = window.location.pathname;

if(adminAreaPath.includes('adminorders')) {
    initAdmin(socket)
    socket.emit('join','adminRoom')
}


socket.on('orderUpdated', (data) => {
    const updatedOrder = { ...order }
    updatedOrder.updatedAt = moment().format()
    updatedOrder.status = data.status
    updateStatus(updatedOrder)
    noty()
})



