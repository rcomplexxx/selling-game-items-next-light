import React, { useEffect, useState } from "react";
import GooglePayButton from "@google-pay/button-react";
import styles from "./googlepay.module.css";
import classNames from "classnames";
import { useRouter } from "next/router";
import swapCountryCode from "@/utils/countryList";

const GooglePay = ({
  products,
  setCartProducts,
  discount,
}) => {
  //paymentRequest.paymentMethodData.tokenizationData.token

  const [totalPrice, setTotalPrice] = useState(
    products
      .reduce((sum, product) => {
        sum += product.price * product.quantity;

        return sum;
      }, 0)
      .toFixed(2)
  );

  const router = useRouter();

  useEffect(() => {
    let totalPriceNow = products
      .reduce((sum, product) => {
        sum += product.price * product.quantity;

        return sum;
      }, 0)
      .toFixed(2);

    if (discount.discount!=0) {
      totalPriceNow = totalPriceNow - (totalPriceNow * discount.discount) / 100;
      totalPriceNow = totalPriceNow.toFixed(2);
    }
    console.log("price", totalPriceNow);
    setTotalPrice(totalPriceNow);
  }, [discount.discount, products]);

  const handleGpayOrder = async (paymentData) => {
    try {
      console.log("Time to uncover data", paymentData);

      const paymentToken = JSON.parse(
        paymentData.paymentMethodData.tokenizationData.token
      ).id;

      const discountEl = document.getElementById("discountCode");
      console.log("disc el", discountEl);
      let discountCode = "";
      if (discountEl) {
        discountCode = discountEl.innerText;
      }


      const finalTotalPriceEl = document.getElementById("totalPrice");
    
      let finalTotalPrice = totalPrice;
      console.log('final price', finalTotalPrice)
      if (finalTotalPriceEl) {
        finalTotalPrice = finalTotalPriceEl.innerText;
        finalTotalPrice= finalTotalPrice.substring(finalTotalPrice.indexOf("$") + 1).trim();

      }
      console.log('final price', finalTotalPrice)
      

      const items = [];
      products.map((product) => {
        items.push({
          id: product.id,
          quantity: product.quantity,
          variant: product.variant,
        });
      });

      let firstName,
        lastName = "";
      const name = paymentData.shippingAddress.name;
      const lastSpaceIndex = name.lastIndexOf(" ");

      // Check if a space was found
      if (lastSpaceIndex !== -1) {
        // Extract the first part and the second part
        firstName = name.slice(0, lastSpaceIndex);
        lastName = name.slice(lastSpaceIndex);
      } else {
        firstName = name;
      }

      const requestData = {
        order: {
          email: paymentData.email,
          firstName: firstName,
          lastName: lastName,
          address: paymentData.shippingAddress.address1,
          apt: undefined,
          country: swapCountryCode(paymentData.shippingAddress.countryCode),
          zipcode: paymentData.shippingAddress.postalCode,
          state: paymentData.shippingAddress.administrativeArea,
          city: paymentData.shippingAddress.locality,
          phone: paymentData.shippingAddress.phoneNumber,
          discountCode: discountCode,
          items: items,
        },
        paymentMethod: "GPAY",
        paymentToken: paymentToken,

        // Include other payment-related data if required
      };

      const requestDataFinal = { ...requestData, amount: parseFloat(finalTotalPrice).toFixed(2) };

      console.log("mydata", requestData);
      return await fetch("/api/make-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...requestDataFinal,
          items: JSON.stringify(requestDataFinal.items),
        }),
      })
        .then((response) => response.json())
        .then((validation) => {
          if (validation.success) {
            console.log("Validation true", validation.message);

            setCartProducts([]);
            router.push("/thank-you");

            return { transactionState: "SUCCESS" };
          } else {
            console.log(validation.error);

            if (validation.error === "amount_incorrect")
              return {
                transactionState: "ERROR",
                error: {
                  reason: "OFFER_INVALID",
                  message: "Amount of products is not correct on server side.",
                  intent: "OFFER",
                },
              };
            else
              return {
                transactionState: "ERROR",
                error: {
                  reason: "OTHER_ERROR",
                  message: "Unknown error has occured.",
                  intent: "PAYMENT_AUTHORIZATION",
                },
              };
          }
        })
        .catch((error) => {
          // Handle errors that occur during the fetch or processing of the response
          console.error("Error creating order:", error);
          throw error; // Rethrow the error for the calling code to handle
        });
    } catch (err) {
      console.log(err);
      return { success: false, error: "Payment was not approved." };
    }
  };

  return (
    <GooglePayButton
      environment={process.env.GPAYENVIRENMENT}
      className={classNames(styles.gpayButton)}
      buttonType="plain"
      buttonSizeMode="fill"
      buttonColor="white"
      paymentRequest={{
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: "CARD",
            parameters: {
              allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
              allowedCardNetworks: ["AMEX", "DISCOVER", "MASTERCARD", "VISA"],
            },
            tokenizationSpecification: {
              type: "PAYMENT_GATEWAY",
              parameters: {
                gateway: "stripe",
                "stripe:version": "2023-10-16",
                "stripe:publishableKey":
                  "pk_test_51OR1EhAom3KfH7oBf5QRKboVHPrFIrZ3nwmtwS30uSDtrHbpgwsFzf19Np73RjxFiAqUy0tjPi5BIYdDmSPDExya00m4ZFZoI1",
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: "BCR2DN4TZLVYPEIX",
          merchantName: "Demo Merchant",
        },
        transactionInfo: {
          totalPriceStatus: "ESTIMATED",
          totalPriceLabel: "Total",
          totalPrice: `${totalPrice}`,
          currencyCode: "USD",
          countryCode: "US",
        },

        emailRequired: true,
        shippingAddressRequired: true,
        shippingAddressParameters: {
          phoneNumberRequired: true,
        },
        callbackIntents: ["PAYMENT_AUTHORIZATION", "SHIPPING_ADDRESS"],
      }}
      existingPaymentMethodRequired={false}
      onLoadPaymentData={(paymentRequest) => {
        console.log("load payment data", paymentRequest);
        //  handleGpayOrder(paymentRequest.paymentMethodData.tokenizationData.token)
      }}
      onPaymentAuthorized={handleGpayOrder}
      onPaymentDataChanged={(paymentData) => {
        console.log("Data changed", paymentData);
      }}
      onError={(reason) => {
        console.log(reason);
      }}
    />
  );
};

export default GooglePay;

// onPaymentDataChanged={()=>{}}

//  merchantInfo: {
//   merchantId: 'BCR2DN4TZLVYPEIX',
//   merchantName: 'Demo Merchant',
// },

//ERROR
// error: {
//   reason: "SHIPPING_ADDRESS_UNSERVICEABLE",
//   message: "We are not providing shipping service on that shipping address.",
//   intent: "SHIPPING_ADDRESS"
// }
//OFFER_INVALID
//OFFER

// allowedCountryCodes:"US"

//dodaj discount u amount.

// offerDetail: {
//   redemptionCode: "PROMOTIONALCODE",
//   description: "An excellent discount"
// },
