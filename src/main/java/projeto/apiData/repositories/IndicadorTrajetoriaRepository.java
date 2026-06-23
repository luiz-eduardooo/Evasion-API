package projeto.apiData.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import projeto.apiData.entities.IndicadorTrajetoria;
import projeto.apiData.services.EvasaoAgregada;

public interface IndicadorTrajetoriaRepository
        extends JpaRepository<IndicadorTrajetoria, Long> {

    @Query("""
        SELECT new projeto.apiData.services.EvasaoAgregada(
            SUM(i.qtDesistencia),
            SUM(i.qtIngressante)
        )
        FROM IndicadorTrajetoria i
        WHERE i.coCineAreaGeral = :area
          AND i.coRegiao = :regiao
          AND i.nuAnoIngresso = :coorte
          AND i.nuAnoReferencia = i.nuAnoMaximoAcompanhamento
        """)
    EvasaoAgregada agregarEvasao(
            @Param("area") Integer area,
            @Param("regiao") Integer regiao,
            @Param("coorte") Integer coorte);
}