import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="container">
      <section className="not-found" aria-labelledby="not-found-title">
        <span className="not-found__code" aria-hidden="true">
          404
        </span>
        <Icon name="alert-triangle" size={40} />
        <h1 id="not-found-title" className="not-found__title">
          Page not found
        </h1>
        <p className="not-found__description">
          The page you are looking for does not exist or has been moved. Please
          return to the home page to continue.
        </p>
        <Button to="/" icon="arrowRight" iconPosition="right">
          Back to Home
        </Button>
      </section>
    </div>
  )
}