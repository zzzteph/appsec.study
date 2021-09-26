<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTopicNodeConditionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('topic_node_conditions', function (Blueprint $table) {
            $table->id();
			$table->foreignId('topic_node_id')->constrained()->onUpdate('cascade')->onDelete('cascade');
			$table->enum('type', ['timeout'])->default('timeout');
			$table->string('value', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('topic_node_conditions');
    }
}
