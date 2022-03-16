import React, { FC, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Form,
  FormField,
  Heading,
  Layer,
  Notification,
  Spinner,
  TextInput,
} from 'grommet';

import { useLogin } from '../hooks';

import { LoginMutation } from '../gql';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const initialState = { email: '', password: '' };

const LoginModal: FC<Props> = ({ visible, onClose }) => {
  const [formValues, setFormValues] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const handleClose = useCallback(() => {
    onClose();
    setFormValues(initialState);
  }, [onClose, setFormValues]);

  const handleCompleted = useCallback(
    (data: LoginMutation) => {
      if (!data.login?.jwt) {
        setErrorMessage('Invalid username or password.');
      } else {
        setSuccessMessage('Successfully logged in.');
        handleClose();
      }
    },
    [setErrorMessage, setSuccessMessage, formValues, handleClose]
  );

  const [login, { loading, error }] = useLogin(handleCompleted);

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
    }
  }, [error, setErrorMessage]);

  return (
    <>
      {!!errorMessage && (
        <Notification
          toast
          status="critical"
          title="Login unsuccessful"
          message={errorMessage}
          onClose={() => setErrorMessage(undefined)}
        />
      )}
      {!!successMessage && (
        <Notification
          toast
          status="normal"
          title={successMessage}
          onClose={() => setSuccessMessage(undefined)}
        />
      )}
      {visible && (
        <Layer onClickOutside={handleClose} background="transparent" responsive={false}>
          <Box pad={{ horizontal: 'medium', bottom: 'medium' }} width="medium" background="light-2">
            <Heading level={3}>Login</Heading>
            <Form
              value={formValues}
              onChange={setFormValues}
              onSubmit={({ value }) => login(value)}
            >
              <FormField
                label="Email"
                name="email"
                htmlFor="login-email"
                required
                validate={[
                  {
                    regexp: /^[a-z0-9\._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/,
                    message: 'Invalid email address.',
                  },
                ]}
              >
                <TextInput name="email" type="email" id="login-email" />
              </FormField>
              <FormField label="Password" name="password" htmlFor="login-password" required>
                <TextInput name="password" type="password" id="login-password" />
              </FormField>
              <Box direction="row" justify="between">
                <Button label="Cancel" onClick={handleClose} />
                <Button
                  primary
                  type="submit"
                  label="Submit"
                  disabled={loading}
                  icon={loading ? <Spinner /> : undefined}
                />
              </Box>
            </Form>
          </Box>
        </Layer>
      )}
    </>
  );
};

export default LoginModal;
