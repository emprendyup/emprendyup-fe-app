// lib/graphql/payments.ts
import { gql } from '@apollo/client';

export const CREATE_PAYMENT_REQUEST = gql`
  mutation CreatePaymentRequest($input: CreatePaymentRequestInput!) {
    createPaymentRequest(input: $input) {
      id
      invoiceId
      amount
      status
      paymentMethod
      customerEmail
      customerName
      customerPhone
      planId
      plan {
        id
        name
        price
        description
      }
      paymentUrl
      expiresAt
      createdAt
    }
  }
`;

export const PROCESS_PAYMENT_RESPONSE = gql`
  mutation ProcessPaymentResponse($input: ProcessPaymentResponseInput!) {
    processPaymentResponse(input: $input) {
      id
      status
      transactionId
      referenceCode
      responseCode
      responseMessage
      approvalCode
      errorMessage
      processedAt
      order {
        id
        status
        total
      }
    }
  }
`;

export const GET_PAYMENT_STATUS = gql`
  query GetPaymentStatus($invoiceId: String!) {
    paymentByInvoice(invoiceId: $invoiceId) {
      id
      status
      amount
      transactionId
      responseCode
      responseMessage
      customerEmail
      plan {
        id
        name
        price
      }
      createdAt
      processedAt
    }
  }
`;

export const GET_USER_PAYMENTS = gql`
  query GetUserPayments($filter: PaymentFilterInput, $pagination: PaginationInput) {
    userPayments(filter: $filter, pagination: $pagination) {
      payments {
        id
        invoiceId
        amount
        status
        paymentMethod
        plan {
          id
          name
          price
        }
        createdAt
        processedAt
      }
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
`;

export const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($input: UpdateSubscriptionInput!) {
    updateSubscription(input: $input) {
      id
      status
      planId
      plan {
        id
        name
        price
        features
      }
      startDate
      endDate
      isActive
      paymentMethod
    }
  }
`;
