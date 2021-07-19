import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import useConstant from 'use-constant';
import PropTypes from 'prop-types';
import Input, { InputTitle, Separator } from '../../common/molecules/Input';
import Button from '../../common/atoms/Button';
import { appContext } from '../../contexts/app';
import {
  BTC_REGEX,
  EMAIL_REGEX,
  ERC20_REGEX,
  PASSWORD_REGEX,
  setFormErrors,
  TRX_REGEX,
} from '../../util/form';
import Message from '../../common/atoms/Message';
import { USER_MERCHANT } from '../../util/constants';
import FileInput from '../../common/molecules/FileInput';

const ProfileForm = ({ hideFields = [] }) => {
  const { api, user, setUser } = useContext(appContext);
  const isMerchant = useConstant(() => user.role === USER_MERCHANT);
  useEffect(() => {
    isMerchant && register({ name: 'logoUrl' }, { required: 'Required' });
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const { handleSubmit, register, errors, watch, setError, setValue } = useForm(
    {
      mode: 'onBlur',
      defaultValues: {
        ...user,
      },
    },
  );

  const onSubmit = async values => {
    setLoading(true);
    try {
      const updatedUser = await api.put('user/me', values);
      setUser(updatedUser);
      setChangePassword(false);
      setIsSaved(true);
      setValue('newPassword', '');
      setValue('oldPassword', '');
      setValue('repeatPassword', '');
    } catch (error) {
      setFormErrors(error, setError);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {!hideFields.includes('name') && (
        <Input
          type="text"
          name="name"
          placeholder="Your name"
          isRequired
          title="Name"
          error={errors.name}
          ref={register({ required: 'Required' })}
        />
      )}

      {!hideFields.includes('email') && (
        <Input
          type="email"
          name="email"
          placeholder="Your email address"
          isRequired
          disabled
          title="Email"
          error={errors.email}
          ref={register({
            required: 'Required',
            pattern: {
              value: EMAIL_REGEX,
              message: 'Invalid email address',
            },
          })}
        />
      )}

      {!isMerchant && (
        <>
          <Separator />
          <InputTitle marginBottom={18} block>
            Payment methods
          </InputTitle>

          <Input
            type="text"
            name="paymentCredentials.paypal"
            placeholder="Paypal email"
            title="Paypal email"
            error={
              errors.paymentCredentials && errors.paymentCredentials.paypal
            }
            ref={register({
              pattern: {
                value: EMAIL_REGEX,
                message: 'Invalid email address',
              },
            })}
          />

          <Input
            type="text"
            name="paymentCredentials.bitcoin"
            placeholder="Bitcoin address"
            title="Bitcoin"
            error={
              errors.paymentCredentials && errors.paymentCredentials.bitcoin
            }
            ref={register({
              pattern: {
                value: BTC_REGEX,
                message: 'Invalid BTC address',
              },
            })}
          />

          <Input
            type="text"
            name="paymentCredentials.usdt"
            placeholder="ERC20 USDT address"
            title="ERC20 USDT"
            error={errors.paymentCredentials && errors.paymentCredentials.usdt}
            ref={register({
              pattern: {
                value: ERC20_REGEX,
                message: 'Invalid ERC20 address',
              },
            })}
          />

          <Input
            type="text"
            name="paymentCredentials.trxusdt"
            placeholder="TRC20 USDT address"
            title="TRC20 USDT"
            error={
              errors.paymentCredentials && errors.paymentCredentials.trxusdt
            }
            ref={register({
              pattern: {
                value: TRX_REGEX,
                message: 'Invalid TRX address',
              },
            })}
          />
        </>
      )}

      {isMerchant && (
        <>
          <Input
            type="text"
            name="zignalyId"
            placeholder="Your Zignaly User ID"
            description={
              <>
                ID can be found{' '}
                <a
                  href="https://zignaly.com/app/dashboard/#settings-profile"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  here
                </a>
                .
              </>
            }
            title="Zignaly User ID"
            isRequired
            error={errors.zignalyId}
            ref={register({ required: 'Required' })}
          />

          <Input
            type="textarea"
            name="aboutUs"
            rows={6}
            placeholder="Provide affiliates with some information about you (250 characters minumum)"
            title="About Us"
            isRequired
            error={errors.aboutUs}
            ref={register({
              required: 'Required',
              validate: value =>
                (value && value.length >= 250) ||
                `250 characters minimum. You've entered ${value.length}`,
            })}
          />

          <Input
            type="textarea"
            name="termsAndConditions"
            rows={6}
            placeholder="Terms and conditions for your campaigns (optional)"
            title="Terms and conditions"
            error={errors.termsAndConditions}
            ref={register({})}
          />

          <FileInput
            label="Logo"
            isRequired
            display={file =>
              file && <img src={file.path} alt={watch('name')} width={300} />
            }
            file={watch('logoUrl')}
            onChange={url => setValue('logoUrl', url)}
            error={errors.logoUrl}
            onError={uploadErrors => setFormErrors(uploadErrors, setError)}
            onUploadStarted={() => setUploading(true)}
            onUploadEnded={() => setUploading(false)}
          />

          <Separator />

          <InputTitle marginBottom={18} block isRequired>
            Accepted payout methods
          </InputTitle>

          <Input
            type="checkbox"
            name="paymentMethodSupport.paypal"
            title="PayPal"
            error={
              errors.paymentMethodSupport && errors.paymentMethodSupport.paypal
            }
            ref={register({})}
          />

          <Input
            type="checkbox"
            name="paymentMethodSupport.bitcoin"
            title="Bitcoin"
            error={
              errors.paymentMethodSupport && errors.paymentMethodSupport.bitcoin
            }
            ref={register({})}
          />

          <Input
            type="checkbox"
            name="paymentMethodSupport.trxusdt"
            title="TRC20 USDT"
            error={
              errors.paymentMethodSupport && errors.paymentMethodSupport.trxusdt
            }
            ref={register({})}
          />

          <Input
            type="checkbox"
            name="paymentMethodSupport.usdt"
            title="ERC20 USDT"
            error={
              errors.paymentMethodSupport && errors.paymentMethodSupport.usdt
            }
            ref={register({
              validate: () =>
                !!watch('paymentMethodSupport.paypal') ||
                !!watch('paymentMethodSupport.bitcoin') ||
                !!watch('paymentMethodSupport.usdt') ||
                'At least one payment method should be supported',
            })}
          />
        </>
      )}

      <Separator />

      {!hideFields.includes('changePassword') && (
        <Input
          type="checkbox"
          title="Change password"
          onClick={() => setChangePassword(v => !v)}
        />
      )}

      {changePassword && (
        <>
          <Input
            type="password"
            name="newPassword"
            placeholder="Super strong new password"
            title="Password"
            error={errors.newPassword}
            ref={register({
              required: 'Required',
              pattern: {
                value: PASSWORD_REGEX,
                message:
                  'Your password should contain letters and special characters or digits & 8 characters min',
              },
            })}
          />

          <Input
            type="password"
            name="repeatPassword"
            placeholder="Repeat new password"
            title="Repeat password"
            error={errors.repeatPassword}
            ref={register({
              validate: value =>
                value === watch('newPassword') || 'Passwords do not match',
            })}
          />

          <Input
            type="password"
            name="oldPassword"
            placeholder="Your current password"
            title="Old Password"
            error={errors.oldPassword}
            ref={register({
              required: 'Required',
              pattern: {
                value: PASSWORD_REGEX,
                message:
                  'Your password should contain letters and special characters or digits & 8 characters min',
              },
            })}
          />
        </>
      )}

      <Input
        type="checkbox"
        name="mailingList"
        title="Accept promotional materials"
        ref={register({})}
      />

      {isSaved && <Message success>Changes saved</Message>}

      <Button
        primary
        type="submit"
        data-tootik={uploading ? 'Wait till the upload finishes' : ''}
        disabled={uploading}
        isLoading={loading || undefined}
      >
        {loading ? 'Updating...' : 'Update info'}
      </Button>
    </form>
  );
};

ProfileForm.propTypes = {
  hideFields: PropTypes.arrayOf(PropTypes.string),
};

export default ProfileForm;
