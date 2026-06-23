package projeto.apiData.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import projeto.apiData.dto.PontoCurva;
import projeto.apiData.dto.RankingItem;
import projeto.apiData.entities.IndicadorTrajetoria;
import projeto.apiData.services.EvasaoAgregada;

import java.util.List;

public interface IndicadorTrajetoriaRepository
        extends JpaRepository<IndicadorTrajetoria, Long> {

    @Query("""
    SELECT new projeto.apiData.services.EvasaoAgregada(
        SUM(i.tda * i.qtIngressante) / 100,
        SUM(i.qtIngressante)
    )
    FROM IndicadorTrajetoria i
    WHERE i.coCineAreaGeral = :area
      AND i.coRegiao = :regiao
      AND i.nuAnoIngresso = :coorte
      AND i.nuAnoReferencia = i.nuAnoMaximoAcompanhamento
    """)
    EvasaoAgregada agregarEvasao(@Param("area") Integer area,
                                 @Param("regiao") Integer regiao,
                                 @Param("coorte") Integer coorte);



    @Query("""
    SELECT new projeto.apiData.dto.PontoCurva(
        i.nuAnoReferencia,
        SUM(i.tda * i.qtIngressante) / SUM(i.qtIngressante)
    )
    FROM IndicadorTrajetoria i
    WHERE i.coCineAreaGeral = :area
      AND i.coRegiao = :regiao
      AND i.nuAnoIngresso = :coorte
    GROUP BY i.nuAnoReferencia
    ORDER BY i.nuAnoReferencia
    """)
    List<PontoCurva> curvaEvasao(@Param("area") Integer area,
                                 @Param("regiao") Integer regiao,
                                 @Param("coorte") Integer coorte);


    @Query("""
    SELECT new projeto.apiData.dto.RankingItem(
        i.noCineAreaGeral,
        SUM(i.tda * i.qtIngressante) / SUM(i.qtIngressante),
        SUM(i.qtIngressante)
    )
    FROM IndicadorTrajetoria i
    WHERE i.nuAnoIngresso = :coorte
      AND i.nuAnoReferencia = i.nuAnoMaximoAcompanhamento
    GROUP BY i.noCineAreaGeral
    ORDER BY SUM(i.tda * i.qtIngressante) / SUM(i.qtIngressante) DESC
    """)
    List<RankingItem> rankingPorArea(@Param("coorte") Integer coorte);
}