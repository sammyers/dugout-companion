import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Image,
  Notification,
  Spinner,
  Text,
  TextInput,
} from 'grommet';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

import { useResetPasswordMutation } from '@sammyers/dc-shared';
import { decodeResetPasswordArgs } from '@sammyers/dc-utils';

const NewAccountPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const args = decodeResetPasswordArgs(searchParams.get('p') ?? '');

  const [formValues, setFormValues] = useState({ password: '', confirmPassword: '' });
  const [errorMessage, setErrorMessage] = useState<string>();
  const [success, setSuccess] = useState(false);

  const [resetPassword, { loading, error }] = useResetPasswordMutation({
    onCompleted: data => {
      if (data.resetPassword?.success) {
        setSuccess(true);
      }
    },
    errorPolicy: 'all',
  });

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
    }
  }, [error]);

  if (!args) {
    return <Navigate to=".." />;
  }

  const { token: resetToken, playerId } = args;

  return (
    <Box align="center" justify="center">
      {!!errorMessage && (
        <Notification
          toast
          status="critical"
          title="Password reset unsuccessful"
          message={errorMessage}
          onClose={() => setErrorMessage(undefined)}
        />
      )}
      <Box background="brand" round width="xsmall" margin="medium">
        <Image src="logo-transparent.png" />
      </Box>
      <Heading level={3}>{success ? 'Account created' : 'Finish creating your account:'}</Heading>
      {success ? (
        <>
          <Text>You may now log into your account. Enjoy!</Text>
          <Button primary label="Go to Home Page" onClick={() => navigate('..')} margin="small" />
        </>
      ) : (
        <Form
          value={formValues}
          onChange={setFormValues}
          onSubmit={({ value }) =>
            resetPassword({ variables: { resetToken, playerId, newPassword: value.password } })
          }
        >
          <FormField
            label="New Password"
            name="password"
            htmlFor="reset-password"
            required
            validate={value => {
              if (value.length < 8) {
                return { status: 'error', message: 'Password must be at least 8 characters.' };
              }
            }}
          >
            <TextInput name="password" type="password" id="reset-password" />
          </FormField>
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            htmlFor="reset-confirm-password"
            required
            validate={(confirmPassword, { password }) => {
              if (confirmPassword !== password) {
                return { status: 'error', message: 'Passwords do not match!' };
              }
            }}
          >
            <TextInput name="confirmPassword" type="password" id="reset-confirm-password" />
          </FormField>
          <Box direction="row" justify="between">
            <Button
              primary
              type="submit"
              label="Submit"
              disabled={loading}
              icon={loading ? <Spinner /> : undefined}
            />
          </Box>
        </Form>
      )}
    </Box>
  );
};

export default NewAccountPage;
