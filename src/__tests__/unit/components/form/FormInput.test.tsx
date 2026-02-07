import { render, screen } from '@testing-library/react';
import FormInput from '@/components/form/FormInput';

describe('FormInput', () => {
  it('should render label and input', () => {
    render(
      <FormInput
        label="Email"
        id="email"
        name="email"
        type="email"
      />
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should display required indicator when required', () => {
    render(
      <FormInput
        label="Email"
        id="email"
        name="email"
        type="email"
        required
      />
    );

    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();
    // Vérifier que l'astérisque est présent
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display error message when error prop is provided', () => {
    render(
      <FormInput
        label="Email"
        id="email"
        name="email"
        type="email"
        error="Email is required"
      />
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should apply error styling when error is present', () => {
    render(
      <FormInput
        label="Email"
        id="email"
        name="email"
        type="email"
        error="Email is required"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });

  it('should display placeholder when provided', () => {
    render(
      <FormInput
        label="Email"
        id="email"
        name="email"
        type="email"
        placeholder="Enter your email"
      />
    );

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('should set correct input type', () => {
    render(
      <FormInput
        label="Password"
        id="password"
        name="password"
        type="password"
      />
    );

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });
});
