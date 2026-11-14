from typing import Dict, Any, List, Optional
from backend.app.models.schemas import ValidationResult

class ScientificValidationEngine:
    """Evaluates hypotheses H1-H5 under Karl Popper's Falsification Principle."""

    @staticmethod
    def evaluate_h1_availability(observation_count: int, target_name: Optional[str] = None) -> ValidationResult:
        if observation_count >= 10:
            status = "SUPPORTED"
            details = f"Verified {observation_count} usable calibrated observations in NASA/IPAC IRSA."
        elif observation_count > 0:
            status = "INCONCLUSIVE"
            details = f"Only {observation_count} observations available; insufficient for comprehensive multi-epoch study."
        else:
            status = "INSUFFICIENT_COVERAGE"
            details = "NASA/IPAC IRSA currently has no public SPHEREx level-2 observations for these sky coordinates in release dr1."

        return ValidationResult(
            hypothesis_id="H1",
            hypothesis_name="Observation Availability",
            target_name=target_name,
            status=status,
            details=details,
            metrics={"observation_count": observation_count},
            provenance={"archive": "NASA/IPAC IRSA", "collection": "spherex_dr1"}
        )

    @staticmethod
    def evaluate_h2_motion(
        predicted_shift_arcsec: float,
        measured_shift_arcsec: float,
        uncertainty_arcsec: float,
        target_name: Optional[str] = None
    ) -> ValidationResult:
        discrepancy = abs(measured_shift_arcsec - predicted_shift_arcsec)
        sigma = discrepancy / max(0.1, uncertainty_arcsec)

        if sigma <= 2.0:
            status = "SUPPORTED"
            details = f"Astrometric motion ({measured_shift_arcsec:.2f}\") matches predicted motion ({predicted_shift_arcsec:.2f}\") within {sigma:.1f}σ uncertainty."
        elif sigma <= 3.5:
            status = "CANDIDATE_DETECTION"
            details = f"Marginal astrometric agreement ({sigma:.1f}σ discrepancy); requires additional epochs."
        else:
            status = "REJECTED"
            details = f"Measured position deviates from astrometric prediction by {sigma:.1f}σ. Hypothesis of predicted space motion rejected."

        return ValidationResult(
            hypothesis_id="H2",
            hypothesis_name="Moving-Object Astrometry",
            target_name=target_name,
            status=status,
            details=details,
            metrics={
                "predicted_shift_arcsec": predicted_shift_arcsec,
                "measured_shift_arcsec": measured_shift_arcsec,
                "uncertainty_arcsec": uncertainty_arcsec,
                "discrepancy_sigma": sigma
            }
        )

    @staticmethod
    def evaluate_h3_difference(
        max_significance_sigma: float,
        control_star_residual_sigma: float,
        target_name: Optional[str] = None
    ) -> ValidationResult:
        if control_star_residual_sigma > 3.0:
            status = "REJECTED"
            details = f"Stationary control stars exhibit systematic subtraction residuals ({control_star_residual_sigma:.1f}σ). Difference imaging calibration rejected."
        elif max_significance_sigma >= 5.0:
            status = "CANDIDATE_DETECTION"
            details = f"Statistically significant transient/moving residual detected at {max_significance_sigma:.1f}σ while control stars remain quiet."
        elif max_significance_sigma >= 3.0:
            status = "INCONCLUSIVE"
            details = f"Marginal residual detected at {max_significance_sigma:.1f}σ."
        else:
            status = "NON_DETECTION"
            details = f"No significant residual detected above background noise (max S = {max_significance_sigma:.1f}σ)."

        return ValidationResult(
            hypothesis_id="H3",
            hypothesis_name="Difference Imaging",
            target_name=target_name,
            status=status,
            details=details,
            metrics={
                "max_significance_sigma": max_significance_sigma,
                "control_star_residual_sigma": control_star_residual_sigma
            }
        )

    @staticmethod
    def evaluate_h4_variability(
        fluxes: List[float],
        errors: List[float],
        time_span_days: float,
        target_name: Optional[str] = None
    ) -> ValidationResult:
        if len(fluxes) < 5 or time_span_days < 7.0:
            return ValidationResult(
                hypothesis_id="H4",
                hypothesis_name="Variable-Star Photometry",
                target_name=target_name,
                status="INCONCLUSIVE",
                details="Observation cadence or count is insufficient to establish physical variability.",
                metrics={"sample_count": len(fluxes), "time_span_days": time_span_days}
            )

        mean_flux = sum(fluxes) / len(fluxes)
        chi2 = sum(((f - mean_flux) / max(1e-6, err))**2 for f, err in zip(fluxes, errors))
        reduced_chi2 = chi2 / (len(fluxes) - 1)

        if reduced_chi2 > 5.0:
            status = "SUPPORTED"
            details = f"Flux variations exceed measurement uncertainties (reduced χ² = {reduced_chi2:.2f})."
        elif reduced_chi2 > 2.0:
            status = "CANDIDATE_DETECTION"
            details = f"Marginal variability signal detected (reduced χ² = {reduced_chi2:.2f})."
        else:
            status = "NON_DETECTION"
            details = f"Constant flux within uncertainties (reduced χ² = {reduced_chi2:.2f}). Variability rejected."

        return ValidationResult(
            hypothesis_id="H4",
            hypothesis_name="Variable-Star Photometry",
            target_name=target_name,
            status=status,
            details=details,
            metrics={"reduced_chi2": reduced_chi2, "mean_flux": mean_flux}
        )

validation_engine = ScientificValidationEngine()
