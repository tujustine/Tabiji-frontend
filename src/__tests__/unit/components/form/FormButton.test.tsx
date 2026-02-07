import { render, screen } from '@testing-library/react';
import FormButton from '@/components/form/FormButton';

describe('FormButton', () => {
  it('should render button with children', () => {
    render(<FormButton>Submit</FormButton>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<FormButton disabled>Submit</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should be disabled when isLoading is true', () => {
    render(<FormButton isLoading>Submit</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading spinner when isLoading is true', () => {
    render(<FormButton isLoading>Submit</FormButton>);
    // Le spinner devrait être présent (vérification via l'icône)
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Vérifier que le bouton contient l'icône de chargement
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should have submit type by default', () => {
    render(<FormButton>Submit</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should apply custom className', () => {
    render(<FormButton className="custom-class">Submit</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });
});
