package projeto.apiData.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "indicador_trajetoria")
@Getter
@Setter
public class IndicadorTrajetoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private Integer coCurso;
    private String  noCurso;
    private Long    coIes;
    private String  noIes;

    private Integer coRegiao;
    private Integer coUf;
    private Integer tpCategoriaAdministrativa;
    private Integer tpModalidadeEnsino;
    private Integer coCineAreaGeral;
    private String  noCineAreaGeral;

    private Integer nuAnoIngresso;
    private Integer nuAnoReferencia;
    private Integer nuAnoMaximoAcompanhamento;

    private Integer qtIngressante;
    private Integer qtPermanencia;
    private Integer qtConcluinte;
    private Integer qtDesistencia;
    private Integer qtFalecido;


    private Double tda;
    private Double tca;
}