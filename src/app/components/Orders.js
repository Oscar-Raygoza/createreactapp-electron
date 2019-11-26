import React, { Component } from "react";
import axios from "axios";
import { WooCommerce } from "../keys";

/**
 * Components
 */
import Card from "../components/containers/Card";
import Loader from "../components/Loader";

/**
 * Server
 */
import { saveAs } from "file-saver";

class Orders extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nextPage: 1,
      loading: true,
      error: null,

      data: {
        orders: []
      },
      pdfData: {
        ordersData: []
      }
    };
  }

  componentDidMount() {
    this.fetchDataOrders();
  }

  async filterDataPDF() {
    let data = [];
    let ordersDataFiler = [];

    this.state.data.orders.map(async order => {
      let orderMap = order;

      if (orderMap.status === "processing") {
        /**
         * *Filter Data PDF for order
         */
        ordersDataFiler = {
          ordersData: {
            name:
              order.shipping_address.first_name +
              " " +
              order.shipping_address.last_name,
            company: order.shipping_address.company,
            address:
              order.shipping_address.address_1 +
              " " +
              order.shipping_address.address_2,
            postcode: order.shipping_address.postcode,
            city: order.shipping_address.city,
            country: order.shipping_address.country,
            state: order.shipping_address.state,
            phone: order.shipping_address.phone,
            shipping_methods: order.shipping_methods,
            note: order.note
          }
        };

        data = await JSON.parse(
          JSON.stringify(this.state.pdfData.ordersData)
        ).concat(ordersDataFiler.ordersData);

        this.setState({
          pdfData: {
            ordersData: data.concat(this.state.pdfData.ordersData)
          }
        });
      }
    });
  }

  async postOrdersPDF() {
    console.log("Fiter DATA");
    await this.filterDataPDF();
    console.log("PDF creating");

    /**
     * *Send data create PDF
     */
    axios
      .post(
        "https://api-management-ec.herokuapp.com/create-pdf",
        this.state.pdfData
      )
      .then(() =>
        axios.get("https://api-management-ec.herokuapp.com/fetch-pdf", {
          responseType: "blob"
        })
      )

      .then(res => {
        const pdfBlob = new Blob([res.data], { type: "application/pdf" });

        saveAs(pdfBlob, "orders.pdf");
      });

    /**
     * Clear PDF data
     */
    this.setState({
      pdfData: {
        ordersData: []
      }
    });
  }

  async showMore() {
    this.setState({
      nextPage: (await this.state.nextPage) + 1,
      loading: true,
      error: null
    });

    try {
      console.log(`orders/?page=${this.state.nextPage}`);

      let dataNext = await WooCommerce.getAsync(
        `orders/?page=${this.state.nextPage}`
      ).then(function(res) {
        let data = JSON.parse(res.toJSON().body);
        return data;
      });

      /**Add the new data in last data orders */
      const data = JSON.parse(JSON.stringify(this.state.data.orders)).concat(
        dataNext.orders
      );

      this.setState({
        data: {
          orders: data
        },
        loading: false
      });
    } catch (error) {
      this.setState({
        error,
        loading: false
      });
    }
  }

  async fetchDataOrders() {
    this.setState({
      loading: true,
      error: null
    });

    try {
      let data = await WooCommerce.getAsync(
        `orders/?page=${this.state.nextPage}`
      ).then(function(result) {
        let data = JSON.parse(result.toJSON().body);
        return data;
      });
      /* @test orders by id
      let dataInfo = await WooCommerce.getAsync(`orders/3752`).then(function(
        result
      ) {
        let data = JSON.parse(result.toJSON().body);
        console.log(data);
        console.log("INFO");
        return data;
      });
      
      console.log(dataInfo); */

      this.setState({
        data,
        loading: false
      });
    } catch (error) {
      this.setState({
        error,
        loading: false
      });
    }
  }

  render() {
    console.log(this.state);
    return (
      <div className="container">
        <div className="App">
          <img src="" alt="" className="logo" />
          <ul className="row">
            {this.state.data.orders.map(order => (
              <li className="col-6 col-md-3" key={order.id}>
                <Card order={order} />
              </li>
            ))}
          </ul>
          {this.state.loading && (
            <div className="loader">
              <Loader />
            </div>
          )}
          {!this.state.loading /*&& this.state.data.info.next */ && (
            <button onClick={() => this.showMore()}>Load More</button>
          )}
          {!this.state.loading /*&& this.state.data.info.next */ && (
            <button onClick={() => this.postOrdersPDF()} className="pdf-button">
              Create PDF
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default Orders;
