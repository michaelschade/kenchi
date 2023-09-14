import 'bootstrap/dist/css/bootstrap.css';

import { useState } from 'react';

import { css } from '@emotion/react';
import qs from 'qs';
import { useLocation } from 'react-router-dom';

const wrapper = css`
  padding: 15px;

  h1 {
    font-size: 1.3em;
    font-weight: bold;
  }

  h2 {
    font-size: 1em;
    font-weight: bold;
    margin-bottom: 0;
  }

  tr {
    height: 40px;
  }

  form input {
    margin-right: 5px;
    height: 31px;

    &:focus {
      box-shadow: inset 0 0 0 0.1rem rgba(0, 123, 255, 0.1);
    }
  }

  form > div {
    overflow: hidden;
    transition: width 0.2s ease-in;
  }
`;

const ExampleShipments = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Shipment search results</h2>
      </div>
      <div className="card-body">
        <table className="table table-sm table-borderless">
          <thead>
            <tr>
              <th scope="col">Shipment #</th>
              <th scope="col">Shipping provider</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td>
                  <small>#</small>
                  {Math.round(Math.random() * 900000) + 100000}
                </td>
                <td>
                  {['FedEx', 'UPS', 'USPS'][Math.floor(Math.random() * 3)]}
                </td>
                <td>
                  {
                    ['Canceled', 'Processing', 'En route', 'Shipped'][
                      Math.floor(Math.random() * 4)
                    ]
                  }
                </td>
                <td>
                  <button className="btn btn-sm btn-outline-primary">
                    view
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExampleOrders = () => {
  const [startRefund, setStartRefund] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="card">
      <div className="card-header">
        <h2>Order search results</h2>
      </div>
      <div className="card-body">
        <table className="table table-sm table-borderless">
          <thead>
            <tr>
              <th style={{ width: '65px' }} scope="col">
                Order #
              </th>
              <th style={{ width: '50px' }} scope="col">
                Card
              </th>
              <th style={{ width: '280px' }} scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ width: '65px' }}>
                <small>#</small>
                <span id="order_number">565878</span>
              </td>
              <td style={{ width: '50px' }}>8662</td>
              <td style={{ width: '280px' }}>
                <form className="form-inline">
                  <div style={startRefund ? { width: '180px' } : { width: 0 }}>
                    <input
                      style={{ width: '175px' }}
                      disabled={saved}
                      className="form-control"
                      type="text"
                      id="refund_reason"
                      placeholder="Refund reason"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.currentTarget.blur();
                      if (startRefund) {
                        setSaved(true);
                      } else {
                        setStartRefund(true);
                      }
                    }}
                    disabled={saved}
                    id={startRefund ? 'save_refund' : 'refund'}
                    className={`btn btn-sm btn-${
                      startRefund ? 'primary' : 'danger'
                    }`}
                    style={startRefund && saved ? { display: 'none' } : {}}
                  >
                    Refund
                  </button>

                  <div
                    style={
                      startRefund && saved
                        ? { width: '70px', marginLeft: '5px' }
                        : { width: '0' }
                    }
                  >
                    <span className="badge badge-success">Refunded</span>
                  </div>

                  <div style={startRefund ? { width: 0 } : { width: '60px' }}>
                    <button
                      style={{ marginLeft: '5px' }}
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </button>
                  </div>
                </form>
              </td>
            </tr>

            <tr>
              <td>
                <small>#</small>330653
              </td>
              <td>1832</td>
              <td>
                <button className="btn btn-sm btn-danger">Refund</button>
                <button
                  style={{ marginLeft: '5px' }}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </td>
            </tr>

            <tr>
              <td>
                <small>#</small>984521
              </td>
              <td>1832</td>
              <td>
                <button className="btn btn-sm btn-danger">Refund</button>
                <button
                  style={{ marginLeft: '5px' }}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </td>
            </tr>

            <tr>
              <td>
                <small>#</small>244265
              </td>
              <td>1832</td>
              <td>
                <button className="btn btn-sm btn-danger">Refund</button>
                <button
                  style={{ marginLeft: '5px' }}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </td>
            </tr>

            <tr>
              <td>
                <small>#</small>812938
              </td>
              <td>8662</td>
              <td>
                <button className="btn btn-sm btn-danger">Refund</button>
                <button
                  style={{ marginLeft: '5px' }}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </td>
            </tr>

            <tr>
              <td>
                <small>#</small>648577
              </td>
              <td>8662</td>
              <td>
                <button className="btn btn-sm btn-danger">Refund</button>
                <button
                  style={{ marginLeft: '5px' }}
                  className="btn btn-sm btn-primary"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function DemoAdmin() {
  const location = useLocation();
  // TODO: wire up shipment=true, orders=true
  const { name, email, shipments, orders, kenchi } = qs.parse(location.search);
  let style = {};
  if (kenchi) {
    style = { paddingLeft: '310px' };
  }
  return (
    <div className="row" css={wrapper} style={style}>
      <div className="col-12" style={{ marginBottom: '15px' }}>
        <h1>Internal Admin Dashboard</h1>
      </div>

      <div className="col-12" style={{ marginBottom: '25px' }}>
        <div className="card">
          <div className="card-header">
            <h2>Search orders</h2>
          </div>
          <div className="card-body">
            <p>
              <strong>Name</strong> <span id="name">{name}</span>
            </p>
            <form>
              <div className="form-group">
                <label htmlFor="emailInput">Email</label>
                <input
                  type="text"
                  className="form-control"
                  defaultValue={email as string}
                  id="emailInput"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
      <br />

      <div className="col-12">
        {shipments ? <ExampleShipments /> : ''}
        {orders ? <ExampleOrders /> : ''}
      </div>
    </div>
  );
}
